import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod, PaymentProvider } from '../../database/entities/payment.entity';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
  ) {}

  async createPending(
    orderId: string,
    amount: number,
    method?: PaymentMethod,
    provider?: PaymentProvider,
    idempotencyKey?: string,
  ): Promise<Payment> {
    const payment = this.repo.create({
      orderId,
      amount,
      status: 'PENDING',
      method,
      provider,
      idempotencyKey,
    });
    return this.repo.save(payment);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIdempotencyKey(key: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { idempotencyKey: key } });
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
  }

  async markSuccess(id: string, providerTxnId: string, providerResponse?: string) {
    await this.repo.update(id, { status: 'SUCCESS', providerTxnId, providerResponse });
  }

  async markFailed(id: string, providerTxnId?: string, providerResponse?: string) {
    await this.repo.update(id, { status: 'FAILED', providerTxnId, providerResponse });
  }

  async updateStatus(id: string, status: PaymentStatus, providerResponse?: string) {
    await this.repo.update(id, { status, providerResponse });
  }

  async refund(id: string, refundedAmount: number) {
    const payment = await this.findById(id);
    if (!payment) return;

    const newRefundedAmount = (payment.refundedAmount || 0) + refundedAmount;
    const newStatus: PaymentStatus =
      newRefundedAmount >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    await this.repo.update(id, {
      refundedAmount: newRefundedAmount,
      status: newStatus,
    });
  }
}


