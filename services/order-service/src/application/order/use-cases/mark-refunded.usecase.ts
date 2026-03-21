import { Inject, Injectable, Logger } from '@nestjs/common';
import { IOrderRepository } from '../../../domain/order/order.repository';
import { OrderStatus } from '../../../domain/order/order.entity';

export interface MarkRefundedInput {
  orderId: string;
  paymentStatus: 'REFUNDED' | 'PARTIALLY_REFUNDED';
}

@Injectable()
export class MarkRefundedUseCase {
  private readonly logger = new Logger(MarkRefundedUseCase.name);

  constructor(@Inject('IOrderRepository') private readonly repo: IOrderRepository) {}

  async execute(input: MarkRefundedInput): Promise<void> {
    const order = await this.repo.findById(input.orderId);
    if (!order) {
      this.logger.warn(`Order ${input.orderId} not found for refund status update`);
      return;
    }

    const targetStatus: OrderStatus = input.paymentStatus;

    // Nếu đơn đã ở trạng thái cuối (REFUNDED) thì bỏ qua
    if (order.status === 'REFUNDED') {
      this.logger.warn(`Order ${input.orderId} already REFUNDED, skipping`);
      return;
    }

    // Nếu order đang ở REFUND_PENDING => chuyển thẳng sang REFUNDED/PARTIALLY_REFUNDED
    if (order.status === 'REFUND_PENDING') {
      await this.repo.updateStatus(input.orderId, targetStatus);
      this.logger.log(`Order ${input.orderId}: REFUND_PENDING -> ${targetStatus}`);
      return;
    }

    // Best-effort: nếu order đang ở trạng thái cho phép (PAID, DELIVERED, COMPLETED, RETURN_RECEIVED, PARTIALLY_REFUNDED)
    // thì chuyển qua REFUND_PENDING rồi sang trạng thái cuối
    const allowRefundFrom: OrderStatus[] = [
      'PAID', 'DELIVERED', 'COMPLETED', 'RETURN_RECEIVED', 'PARTIALLY_REFUNDED',
    ];

    if (allowRefundFrom.includes(order.status)) {
      await this.repo.updateStatus(input.orderId, 'REFUND_PENDING');
      await this.repo.updateStatus(input.orderId, targetStatus);
      this.logger.log(`Order ${input.orderId}: ${order.status} -> REFUND_PENDING -> ${targetStatus}`);
      return;
    }

    this.logger.warn(
      `Order ${input.orderId} has status ${order.status}, cannot transition to ${targetStatus}. Forcing update.`,
    );
    await this.repo.updateStatus(input.orderId, targetStatus);
  }
}
