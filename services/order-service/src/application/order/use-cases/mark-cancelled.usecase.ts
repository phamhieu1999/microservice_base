import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order as OrderOrm } from '../../../database/entities/order.entity';
import { ORDER_CANCELLED_TOPIC, OrderCancelledEvent } from '../../../modules/order/events/order-events';
import { OutboxService } from '../../../outbox/outbox.service';

/**
 * Called when payment fails. Updates order status to CANCELLED
 * and emits order.cancelled so downstream services (e.g. Product Service)
 * can release reserved stock.
 */
@Injectable()
export class MarkCancelledUseCase {
  private readonly logger = new Logger(MarkCancelledUseCase.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly outbox: OutboxService,
  ) {}

  async execute(orderId: string): Promise<void> {
    await this.outbox.executeInTransaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderOrm);
      const order = await orderRepo.findOne({
        where: { id: orderId },
        relations: ['items'],
      });

      if (!order) {
        this.logger.warn(`Order ${orderId} not found for cancellation`);
        return;
      }

      if (order.status === 'CANCELLED') {
        this.logger.warn(`Order ${orderId} already cancelled, skipping`);
        return;
      }

      await orderRepo.update(orderId, { status: 'CANCELLED' });

      const event: OrderCancelledEvent = {
        id: orderId,
        reason: 'Payment failed',
        items: order.items?.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })) ?? [],
      };

      await this.outbox.saveEvent(
        {
          aggregateType: 'Order',
          aggregateId: orderId,
          topic: ORDER_CANCELLED_TOPIC,
          payload: event as unknown as Record<string, unknown>,
        },
        manager,
      );
    });
  }
}
