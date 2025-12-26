import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IOrderRepository } from '../../../domain/order/order.repository';
import { KafkaService } from '../../../kafka/kafka.service';
import { ORDER_CANCELLED_TOPIC, OrderCancelledEvent } from '../../../modules/order/events/order-events';

export interface CancelOrderInput {
  orderId: string;
  userId: string;
  reason?: string;
}

@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject('IOrderRepository') private readonly repo: IOrderRepository,
    private readonly kafka: KafkaService,
  ) {}

  async execute(input: CancelOrderInput): Promise<void> {
    const order = await this.repo.findById(input.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== input.userId) {
      throw new BadRequestException('Not authorized to cancel this order');
    }

    // Chỉ cho phép cancel nếu order chưa được shipped
    const cancellableStatuses = ['PENDING', 'PAID', 'PROCESSING'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(`Cannot cancel order with status: ${order.status}`);
    }

    await this.repo.updateStatus(input.orderId, 'CANCELLED');
    await this.repo.updateCancellationInfo(input.orderId, input.reason, input.userId);

    const event: OrderCancelledEvent = {
      id: input.orderId,
      reason: input.reason || 'User cancelled',
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };
    await this.kafka.emit(ORDER_CANCELLED_TOPIC, event);
  }
}

