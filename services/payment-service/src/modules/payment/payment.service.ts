import { Injectable, BadRequestException, NotFoundException, Optional, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PaymentRepository } from './payment.repository';
import {
  PAYMENT_FAILED_TOPIC,
  PAYMENT_SUCCESS_TOPIC,
  PAYMENT_REFUND_SUCCESS_TOPIC,
  PaymentFailedEvent,
  PaymentRefundSuccessEvent,
  PaymentSuccessEvent,
  SellerShare,
} from './events/payment-events';
import { PromotionClient } from '../../promotion/promotion.client';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { Payment, PaymentStatus, PaymentProvider } from '../../database/entities/payment.entity';
import { randomUUID } from 'crypto';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';
import { OutboxService } from '../../outbox/outbox.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly repo: PaymentRepository,
    private readonly dataSource: DataSource,
    private readonly outbox: OutboxService,
    private readonly promotionClient: PromotionClient,
    private readonly providerFactory: PaymentProviderFactory,
    @Optional() private readonly circuitBreaker?: CircuitBreakerService,
  ) {}

  async processOrderCreated(event: {
    id: string;
    userId: string;
    totalAmount: number;
    voucherId?: string;
    paymentMethod?: 'CARD' | 'EWALLET' | 'BANK_TRANSFER' | 'COD';
    items?: Array<{ productId: string; quantity: number; unitPrice: number; sellerId?: string }>;
  }) {
    const method = event.paymentMethod || 'CARD';
    const isCod = method === 'COD';
    const success = isCod ? true : Math.random() > 0.2;
    const providerTxnId = `mock-${method.toLowerCase()}-${Date.now()}`;

    let sellerShares: SellerShare[] | undefined;
    if (success && event.items && Array.isArray(event.items)) {
      const map = new Map<string, number>();
      for (const item of event.items) {
        if (!item.sellerId) continue;
        const lineTotal = item.unitPrice * (item.quantity || 1);
        map.set(item.sellerId, (map.get(item.sellerId) || 0) + lineTotal);
      }
      if (map.size > 0) {
        sellerShares = Array.from(map.entries()).map(([sellerId, amount]) => ({
          sellerId,
          amount,
        }));
      }
    }

    // Atomic: create payment + outbox event in a single transaction
    await this.outbox.executeInTransaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);

      const payment = paymentRepo.create({
        orderId: event.id,
        amount: event.totalAmount,
        status: success ? 'SUCCESS' : 'FAILED',
        method,
        provider: 'MOCK',
        providerTxnId,
      });
      const saved = await paymentRepo.save(payment);

      if (success) {
        const successEvent: PaymentSuccessEvent = {
          orderId: saved.orderId,
          paymentId: saved.id,
          amount: Number(saved.amount),
          userId: event.userId,
          sellerShares,
        };
        await this.outbox.saveEvent(
          {
            aggregateType: 'Payment',
            aggregateId: saved.id,
            topic: PAYMENT_SUCCESS_TOPIC,
            payload: successEvent as unknown as Record<string, unknown>,
          },
          manager,
        );
      } else {
        const failedEvent: PaymentFailedEvent = {
          orderId: event.id,
          reason: 'MOCK_PROVIDER_FAILED',
          userId: event.userId,
        };
        await this.outbox.saveEvent(
          {
            aggregateType: 'Payment',
            aggregateId: saved.id,
            topic: PAYMENT_FAILED_TOPIC,
            payload: failedEvent as unknown as Record<string, unknown>,
          },
          manager,
        );
      }
    });

    // Apply voucher outside transaction (best-effort, non-critical)
    if (success && event.voucherId && event.userId) {
      try {
        await this.promotionClient.apply(event.voucherId, event.userId);
      } catch (err) {
        this.logger.warn(`Failed to apply voucher ${event.voucherId}: ${(err as Error).message}`);
      }
    }
  }

  async createPayment(dto: CreatePaymentDto, userId: string) {
    if (dto.idempotencyKey) {
      const existing = await this.repo.findByIdempotencyKey(dto.idempotencyKey);
      if (existing) {
        return { payment: existing, paymentUrl: null };
      }
    }

    const idempotencyKey = dto.idempotencyKey || randomUUID();
    const provider = dto.provider || 'MOCK';

    const payment = await this.repo.createPending(
      dto.orderId,
      dto.amount,
      dto.method,
      provider as PaymentProvider,
      idempotencyKey,
    );

    const paymentProvider = this.providerFactory.getProvider(provider as PaymentProvider);

    const paymentRequest = {
      orderId: dto.orderId,
      amount: dto.amount,
      method: dto.method,
      description: dto.description,
      returnUrl: process.env.PAYMENT_RETURN_URL || 'http://localhost:3000/payment/callback',
      cancelUrl: process.env.PAYMENT_CANCEL_URL || 'http://localhost:3000/payment/cancel',
    };

    const response = this.circuitBreaker
      ? await this.circuitBreaker.execute(
          `payment-provider-${provider}`,
          () => paymentProvider.createPayment(paymentRequest),
          async () => ({
            success: false,
            paymentId: dto.orderId,
            error: 'PAYMENT_PROVIDER_UNAVAILABLE',
          }),
          {
            failureThreshold: 5,
            timeout: 10000,
            resetTimeout: 60000,
          },
        )
      : await paymentProvider.createPayment(paymentRequest);

    if (!response.success) {
      await this.repo.markFailed(payment.id, undefined, response.error);
      return { payment, paymentUrl: response.paymentUrl, qrCode: response.qrCode };
    }

    if (dto.method === 'COD') {
      await this.outbox.executeInTransaction(async (manager) => {
        const paymentRepo = manager.getRepository(Payment);
        await paymentRepo.update(payment.id, {
          status: 'SUCCESS',
          providerTxnId: response.providerTxnId,
          providerResponse: JSON.stringify({ method: 'COD', note: 'Thu tiền khi giao hàng' }),
        });

        const successEvent: PaymentSuccessEvent = {
          orderId: payment.orderId,
          paymentId: payment.id,
          amount: Number(payment.amount),
          userId,
        };
        await this.outbox.saveEvent(
          {
            aggregateType: 'Payment',
            aggregateId: payment.id,
            topic: PAYMENT_SUCCESS_TOPIC,
            payload: successEvent as unknown as Record<string, unknown>,
          },
          manager,
        );
      });
      payment.status = 'SUCCESS';
    } else {
      await this.repo.updateStatus(payment.id, 'PENDING', JSON.stringify(response));
    }

    return {
      payment,
      paymentUrl: response.paymentUrl,
      qrCode: response.qrCode,
    };
  }

  async handleWebhook(provider: PaymentProvider, payload: any, signature: string) {
    const paymentProvider = this.providerFactory.getProvider(provider);

    const isValid = paymentProvider.verifyWebhook(payload, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const result = await paymentProvider.processWebhook(payload);
    const payments = await this.repo.findByOrderId(result.paymentId);
    if (!payments || payments.length === 0) {
      throw new NotFoundException('Payment not found');
    }

    const latestPayment = payments[0];

    // Atomic: update payment status + emit event via outbox
    await this.outbox.executeInTransaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      await paymentRepo.update(latestPayment.id, {
        status: result.status as PaymentStatus,
        providerResponse: JSON.stringify(payload),
      });

      if (result.status === 'SUCCESS') {
        const successEvent: PaymentSuccessEvent = {
          orderId: latestPayment.orderId,
          paymentId: latestPayment.id,
          amount: Number(latestPayment.amount),
          userId: payload.metadata?.userId,
        };
        await this.outbox.saveEvent(
          {
            aggregateType: 'Payment',
            aggregateId: latestPayment.id,
            topic: PAYMENT_SUCCESS_TOPIC,
            payload: successEvent as unknown as Record<string, unknown>,
          },
          manager,
        );
      } else if (result.status === 'FAILED') {
        const failedEvent: PaymentFailedEvent = {
          orderId: latestPayment.orderId,
          reason: 'PROVIDER_FAILED',
          userId: payload.metadata?.userId,
        };
        await this.outbox.saveEvent(
          {
            aggregateType: 'Payment',
            aggregateId: latestPayment.id,
            topic: PAYMENT_FAILED_TOPIC,
            payload: failedEvent as unknown as Record<string, unknown>,
          },
          manager,
        );
      }
    });

    return { success: true, paymentId: latestPayment.id, status: result.status };
  }

  async refund(paymentId: string, dto: RefundPaymentDto) {
    const payment = await this.repo.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'SUCCESS' && payment.status !== 'PARTIALLY_REFUNDED') {
      throw new BadRequestException('Only successful or partially-refunded payments can be refunded');
    }

    const currentRefunded = Number(payment.refundedAmount || 0);
    if (currentRefunded + dto.amount > Number(payment.amount)) {
      throw new BadRequestException('Refund amount exceeds payment amount');
    }

    const paymentProvider = this.providerFactory.getProvider(payment.provider || 'MOCK');

    const refundResponse = this.circuitBreaker
      ? await this.circuitBreaker.execute(
          `payment-provider-${payment.provider}-refund`,
          () =>
            paymentProvider.refund({
              paymentId: payment.id,
              amount: dto.amount,
              reason: dto.reason,
            }),
          async () => {
            throw new BadRequestException('Payment provider unavailable for refund');
          },
        )
      : await paymentProvider.refund({
          paymentId: payment.id,
          amount: dto.amount,
          reason: dto.reason,
        });

    if (!refundResponse.success) {
      throw new BadRequestException(refundResponse.error || 'Refund failed');
    }

    const newRefundedAmount = currentRefunded + dto.amount;
    const newPaymentStatus: 'REFUNDED' | 'PARTIALLY_REFUNDED' =
      newRefundedAmount >= Number(payment.amount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    await this.outbox.executeInTransaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      await paymentRepo.update(payment.id, {
        refundedAmount: newRefundedAmount,
        status: newPaymentStatus,
      });

      const refundEvent: PaymentRefundSuccessEvent = {
        orderId: payment.orderId,
        paymentId: payment.id,
        refundAmount: dto.amount,
        totalRefundedAmount: newRefundedAmount,
        paymentStatus: newPaymentStatus,
      };

      await this.outbox.saveEvent(
        {
          aggregateType: 'Payment',
          aggregateId: payment.id,
          topic: PAYMENT_REFUND_SUCCESS_TOPIC,
          payload: refundEvent as unknown as Record<string, unknown>,
        },
        manager,
      );
    });

    return { success: true, refundId: refundResponse.refundId };
  }

  async getPaymentStatus(paymentId: string) {
    const payment = await this.repo.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }
}
