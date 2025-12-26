import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IOrderRepository } from '../../../domain/order/order.repository';
import { OrderStatus } from '../../../domain/order/order.entity';

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
  changedBy?: string;
  note?: string;
  trackingNumber?: string;
}

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(@Inject('IOrderRepository') private readonly repo: IOrderRepository) {}

  async execute(input: UpdateOrderStatusInput): Promise<void> {
    const order = await this.repo.findById(input.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition – mô phỏng state machine chi tiết hơn (Shopee-like)
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['PAID', 'CANCELLED', 'PAYMENT_EXPIRED', 'BUYER_CANCEL_REQUESTED', 'SYSTEM_CANCELLED'],
      PAID: ['PROCESSING', 'CANCELLED', 'REFUND_PENDING'],
      PROCESSING: ['SHIPPED', 'CANCELLED', 'RETURN_REQUESTED'],
      SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'RETURN_REQUESTED'],
      DELIVERED: ['COMPLETED', 'RETURN_REQUESTED'],
      COMPLETED: [],
      CANCELLED: [],
      PAYMENT_EXPIRED: [],
      BUYER_CANCEL_REQUESTED: ['CANCELLED'],
      SELLER_CANCELLED: [],
      SYSTEM_CANCELLED: [],
      RETURN_REQUESTED: ['RETURN_APPROVED', 'RETURN_REJECTED'],
      RETURN_APPROVED: ['RETURN_IN_TRANSIT'],
      RETURN_REJECTED: [],
      RETURN_IN_TRANSIT: ['RETURN_RECEIVED'],
      RETURN_RECEIVED: ['REFUND_PENDING'],
      REFUND_PENDING: ['REFUNDED', 'PARTIALLY_REFUNDED'],
      REFUNDED: [],
      PARTIALLY_REFUNDED: [],
    };

    const allowedStatuses = validTransitions[order.status];
    if (!allowedStatuses.includes(input.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${input.status}`,
      );
    }

    await this.repo.updateStatus(input.orderId, input.status);

    // Update tracking number nếu có
    if (input.trackingNumber) {
      await this.repo.updateTrackingNumber(input.orderId, input.trackingNumber);
    }

    // Update timestamps
    if (input.status === 'SHIPPED') {
      await this.repo.updateShippedAt(input.orderId);
    } else if (input.status === 'DELIVERED') {
      await this.repo.updateDeliveredAt(input.orderId);
    }
  }
}

