import { Inject, Injectable, Logger } from '@nestjs/common';
import { IOrderRepository } from '../../../domain/order/order.repository';
import { OrderStatus } from '../../../domain/order/order.entity';

export interface SyncShippingStatusInput {
  orderId: string;
  shippingStatus: string;
}

const SHIPPING_TO_ORDER_MAP: Record<string, OrderStatus> = {
  CONFIRMED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURN_RECEIVED',
};

@Injectable()
export class SyncShippingStatusUseCase {
  private readonly logger = new Logger(SyncShippingStatusUseCase.name);

  constructor(@Inject('IOrderRepository') private readonly repo: IOrderRepository) {}

  async execute(input: SyncShippingStatusInput): Promise<void> {
    const targetOrderStatus = SHIPPING_TO_ORDER_MAP[input.shippingStatus];
    if (!targetOrderStatus) {
      return;
    }

    const order = await this.repo.findById(input.orderId);
    if (!order) {
      this.logger.warn(`Order ${input.orderId} not found for shipping sync`);
      return;
    }

    if (order.status === targetOrderStatus) {
      return;
    }

    await this.repo.updateStatus(input.orderId, targetOrderStatus);

    if (targetOrderStatus === 'SHIPPED') {
      await this.repo.updateShippedAt(input.orderId);
    } else if (targetOrderStatus === 'DELIVERED') {
      await this.repo.updateDeliveredAt(input.orderId);
    }

    this.logger.log(
      `Order ${input.orderId}: ${order.status} -> ${targetOrderStatus} (shipping: ${input.shippingStatus})`,
    );
  }
}
