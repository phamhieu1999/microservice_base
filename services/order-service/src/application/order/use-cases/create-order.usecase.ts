import { BadRequestException, Injectable, Logger, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order, OrderItemProps } from '../../../domain/order/order.entity';
import { KafkaRequestReplyService } from '../../../kafka/request-reply.service';
import { ORDER_CREATED_TOPIC, OrderCreatedEvent } from '../../../modules/order/events/order-events';
import { OutboxService } from '../../../outbox/outbox.service';
import { TracingService } from '../../../common/tracing.service';
import { Order as OrderOrm } from '../../../database/entities/order.entity';
import { OrderItem as OrderItemOrm } from '../../../database/entities/order-item.entity';
import { ormToDomain } from '../mappers/order.mapper';

export interface CreateOrderInput {
  userId: string;
  items: OrderItemProps[];
  orderGroupId?: string;
  voucherId?: string;
  /** Mã voucher (để validate qua Promotion – Pattern A) */
  voucherCode?: string;
  discountAmount?: number;
  shippingFee?: number;
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly outbox: OutboxService,
    private readonly requestReply: KafkaRequestReplyService,
    @Optional() private readonly tracing?: TracingService,
  ) {}

  private readonly logger = new Logger(CreateOrderUseCase.name);

  async execute(input: CreateOrderInput): Promise<Order> {
    // Pattern A: Request–Reply reserve stock (Order → Product).
    // Nếu timeout hoặc lỗi network, log cảnh báo nhưng KHÔNG làm fail 500,
    // để tránh chặn toàn bộ flow khi product-service có vấn đề.
    try {
      const reserveReply = await this.requestReply.requestReserveStock({
        items: input.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      if (!reserveReply.success) {
        throw new BadRequestException(reserveReply.error || 'Reserve stock failed');
      }
    } catch (err) {
      this.logger.warn(
        `Reserve stock request-reply failed, tiếp tục tạo đơn nhưng KHÔNG đảm bảo tồn kho. Nguyên nhân: ${
          (err as Error).message
        }`,
      );
    }

    // Pattern A (optional): Validate voucher qua Promotion
    if (input.voucherCode) {
      try {
        const validateReply = await this.requestReply.requestValidateVoucher({
          code: input.voucherCode,
          userId: input.userId,
          items: input.items.map((i) => ({
            productId: i.productId,
            sellerId: i.sellerId || '',
            price: i.unitPrice,
            quantity: i.quantity,
          })),
        });
        if (!validateReply.success) {
          throw new BadRequestException(validateReply.error || 'Voucher invalid');
        }
      } catch (err) {
        this.logger.warn(
          `Validate voucher request-reply failed, bỏ qua voucher. Nguyên nhân: ${
            (err as Error).message
          }`,
        );
      }
    }

    const subtotal = input.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discountAmount = input.discountAmount || 0;
    const shippingFee = input.shippingFee || 0;
    const total = subtotal - discountAmount + shippingFee;

    // Atomic: save order + outbox event in a single DB transaction
    const saved = await this.outbox.executeInTransaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderOrm);
      const itemRepo = manager.getRepository(OrderItemOrm);

      const orm = orderRepo.create({
        userId: input.userId,
        totalAmount: total,
        status: 'PENDING',
        orderGroupId: input.orderGroupId,
        voucherId: input.voucherId,
        discountAmount: input.discountAmount,
        shippingFee: input.shippingFee,
        items: input.items.map((i) =>
          itemRepo.create({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            sellerId: i.sellerId,
          }),
        ),
      });
      const savedOrm = await orderRepo.save(orm);

      const firstSellerId = input.items.find((i) => i.sellerId)?.sellerId;
      const event: OrderCreatedEvent = {
        id: savedOrm.id,
        userId: savedOrm.userId,
        totalAmount: Number(savedOrm.totalAmount),
        orderGroupId: savedOrm.orderGroupId,
        voucherId: savedOrm.voucherId,
        sellerId: firstSellerId,
        items: input.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sellerId: item.sellerId,
        })),
      };

      await this.outbox.saveEvent(
        {
          aggregateType: 'Order',
          aggregateId: savedOrm.id,
          topic: ORDER_CREATED_TOPIC,
          payload: event as unknown as Record<string, unknown>,
        },
        manager,
      );

      return ormToDomain(savedOrm);
    });

    return saved;
  }
}
