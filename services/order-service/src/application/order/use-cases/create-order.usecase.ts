import { Inject, Injectable, Optional } from '@nestjs/common';
import { IOrderRepository } from '../../../domain/order/order.repository';
import { Order, OrderItemProps } from '../../../domain/order/order.entity';
import { KafkaService } from '../../../kafka/kafka.service';
import { ORDER_CREATED_TOPIC, OrderCreatedEvent } from '../../../modules/order/events/order-events';
import { TracingService } from '../../../common/tracing.service';

export interface CreateOrderInput {
  userId: string;
  items: OrderItemProps[];
  orderGroupId?: string;
  voucherId?: string;
  discountAmount?: number;
  shippingFee?: number;
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject('IOrderRepository') private readonly repo: IOrderRepository,
    private readonly kafka: KafkaService,
    @Optional() private readonly tracing?: TracingService,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const total = input.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const order = new Order(
      undefined as any,
      input.userId,
      'PENDING',
      total,
      input.items,
      input.orderGroupId,
      input.voucherId,
      input.discountAmount,
      input.shippingFee,
    );

    const saved = await this.repo.create(order);
    // Lấy sellerId đầu tiên từ items để auto tạo conversation
    const firstSellerId = input.items.find((i) => i.sellerId)?.sellerId;
    const event: OrderCreatedEvent = {
      id: saved.id,
      userId: saved.userId,
      totalAmount: saved.totalAmount,
      orderGroupId: saved.orderGroupId,
      voucherId: saved.voucherId,
      sellerId: firstSellerId,
      items: saved.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        sellerId: item.sellerId,
      })),
    };
    // Get trace ID from current context if available
    const traceId = this.tracing?.getActiveTraceId();
    await this.kafka.emit(ORDER_CREATED_TOPIC, event, traceId);
    return saved;
  }
}


