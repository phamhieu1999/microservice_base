import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order as OrderOrm } from '../../../database/entities/order.entity';
import { ORDER_CANCELLED_TOPIC, OrderCancelledEvent } from '../../../modules/order/events/order-events';
import { OutboxService } from '../../../outbox/outbox.service';

export interface CancelOrderInput {
  orderId: string;
  userId: string;
  reason?: string;
}

@Injectable()
export class CancelOrderUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly outbox: OutboxService,
  ) {}

  async execute(input: CancelOrderInput): Promise<void> {
    await this.outbox.executeInTransaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderOrm);
      const order = await orderRepo.findOne({
        where: { id: input.orderId },
        relations: ['items'],
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.userId !== input.userId) {
        throw new BadRequestException('Not authorized to cancel this order');
      }

      const cancellableStatuses = ['PENDING', 'PAID', 'PROCESSING'];
      if (!cancellableStatuses.includes(order.status)) {
        throw new BadRequestException(`Cannot cancel order with status: ${order.status}`);
      }

      await orderRepo.update(input.orderId, {
        status: 'CANCELLED',
        cancellationReason: input.reason,
        cancelledBy: input.userId,
        cancelledAt: new Date(),
      });

      const event: OrderCancelledEvent = {
        id: input.orderId,
        reason: input.reason || 'User cancelled',
        items: order.items?.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })) ?? [],
      };

      await this.outbox.saveEvent(
        {
          aggregateType: 'Order',
          aggregateId: input.orderId,
          topic: ORDER_CANCELLED_TOPIC,
          payload: event as unknown as Record<string, unknown>,
        },
        manager,
      );
    });
  }
}
