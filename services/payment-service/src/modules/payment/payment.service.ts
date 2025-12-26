import { Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { KafkaService } from '../../kafka/kafka.service';
import {
  PAYMENT_FAILED_TOPIC,
  PAYMENT_SUCCESS_TOPIC,
  PaymentFailedEvent,
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

@Injectable()
export class PaymentService {
  constructor(
    private readonly repo: PaymentRepository,
    private readonly kafka: KafkaService,
    private readonly promotionClient: PromotionClient,
    private readonly providerFactory: PaymentProviderFactory,
    @Optional() private readonly circuitBreaker?: CircuitBreakerService,
  ) {}

  // Được gọi khi nhận event order.created (legacy, giữ để backward compatible)
  async processOrderCreated(event: {
    id: string;
    userId: string;
    totalAmount: number;
    voucherId?: string;
    items?: Array<{ productId: string; quantity: number; unitPrice: number; sellerId?: string }>;
  }) {
    const payment = await this.repo.createPending(
      event.id,
      event.totalAmount,
      'CARD',
      'MOCK',
    );

    // Mock xử lý thanh toán: random success/failed
    const success = Math.random() > 0.2;
    const providerTxnId = `mock-txn-${Date.now()}`;

    if (success) {
      // Tính sellerShares dựa trên items (multi-seller)
      let sellerShares: SellerShare[] | undefined;
      if (event.items && Array.isArray(event.items)) {
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

      await this.repo.markSuccess(payment.id, providerTxnId);
      await this.emitPaymentSuccess(payment, event.userId, event.voucherId, sellerShares);
    } else {
      await this.repo.markFailed(payment.id, providerTxnId);
      await this.emitPaymentFailed(event.id, event.userId, 'MOCK_PROVIDER_FAILED');
    }
  }

  // Tạo payment mới với provider cụ thể
  async createPayment(dto: CreatePaymentDto, userId: string) {
    // Check idempotency
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
    
    // Use circuit breaker to protect payment provider calls
    const response = this.circuitBreaker
      ? await this.circuitBreaker.execute(
          `payment-provider-${provider}`,
          () =>
            paymentProvider.createPayment({
              orderId: dto.orderId,
              amount: dto.amount,
              description: dto.description,
              returnUrl: process.env.PAYMENT_RETURN_URL || 'http://localhost:3000/payment/callback',
              cancelUrl: process.env.PAYMENT_CANCEL_URL || 'http://localhost:3000/payment/cancel',
            }),
          async () => {
            // Fallback: return failed response
            return {
              success: false,
              paymentId: dto.orderId,
              error: 'PAYMENT_PROVIDER_UNAVAILABLE',
            };
          },
          {
            failureThreshold: 5,
            timeout: 10000, // 10 seconds
            resetTimeout: 60000, // 1 minute
          },
        )
      : await paymentProvider.createPayment({
          orderId: dto.orderId,
          amount: dto.amount,
          description: dto.description,
          returnUrl: process.env.PAYMENT_RETURN_URL || 'http://localhost:3000/payment/callback',
          cancelUrl: process.env.PAYMENT_CANCEL_URL || 'http://localhost:3000/payment/cancel',
        });

    if (response.success && response.providerTxnId) {
      await this.repo.updateStatus(payment.id, 'PENDING', JSON.stringify(response));
    } else {
      await this.repo.markFailed(payment.id, undefined, response.error);
    }

    return {
      payment,
      paymentUrl: response.paymentUrl,
      qrCode: response.qrCode,
    };
  }

  // Xử lý webhook từ payment provider
  async handleWebhook(provider: PaymentProvider, payload: any, signature: string) {
    const paymentProvider = this.providerFactory.getProvider(provider);

    // Verify webhook signature
    const isValid = paymentProvider.verifyWebhook(payload, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Process webhook
    const result = await paymentProvider.processWebhook(payload);
    const payment = await this.repo.findByOrderId(result.paymentId);
    if (!payment || payment.length === 0) {
      throw new NotFoundException('Payment not found');
    }

    const latestPayment = payment[0];
    await this.repo.updateStatus(
      latestPayment.id,
      result.status,
      JSON.stringify(payload),
    );

    // Emit Kafka events
    if (result.status === 'SUCCESS') {
      await this.emitPaymentSuccess(latestPayment, payload.metadata?.userId);
    } else if (result.status === 'FAILED') {
      await this.emitPaymentFailed(latestPayment.orderId, payload.metadata?.userId, 'PROVIDER_FAILED');
    }

    return { success: true, paymentId: latestPayment.id, status: result.status };
  }

  // Refund payment
  async refund(paymentId: string, dto: RefundPaymentDto) {
    const payment = await this.repo.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'SUCCESS') {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    if (payment.refundedAmount && payment.refundedAmount + dto.amount > payment.amount) {
      throw new BadRequestException('Refund amount exceeds payment amount');
    }

    const paymentProvider = this.providerFactory.getProvider(payment.provider || 'MOCK');
    
    // Use circuit breaker for refund calls
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

    if (refundResponse.success) {
      await this.repo.refund(payment.id, dto.amount);
    } else {
      throw new BadRequestException(refundResponse.error || 'Refund failed');
    }

    return { success: true, refundId: refundResponse.refundId };
  }

  // Query payment status
  async getPaymentStatus(paymentId: string) {
    const payment = await this.repo.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  private async emitPaymentSuccess(
    payment: Payment,
    userId?: string,
    voucherId?: string,
    sellerShares?: SellerShare[],
  ) {
    const successEvent: PaymentSuccessEvent = {
      orderId: payment.orderId,
      paymentId: payment.id,
      amount: Number(payment.amount),
      userId: userId,
      sellerShares,
    };
    await this.kafka.emit(PAYMENT_SUCCESS_TOPIC, successEvent);

    if (voucherId && userId) {
      await this.promotionClient.apply(voucherId, userId);
    }
  }

  private async emitPaymentFailed(orderId: string, userId?: string, reason?: string) {
    const failedEvent: PaymentFailedEvent = {
      orderId,
      reason: reason || 'PAYMENT_FAILED',
      userId,
    };
    await this.kafka.emit(PAYMENT_FAILED_TOPIC, failedEvent);
  }
}


