import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order as OrderOrm } from '../../../database/entities/order.entity';
import { OrderItem as OrderItemOrm } from '../../../database/entities/order-item.entity';
import { IOrderRepository } from '../../../domain/order/order.repository';
import { Order, OrderStatus } from '../../../domain/order/order.entity';
import { ormToDomain } from '../../../application/order/mappers/order.mapper';

@Injectable()
export class OrderTypeormRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderOrm)
    private readonly orderRepo: Repository<OrderOrm>,
    @InjectRepository(OrderItemOrm)
    private readonly itemRepo: Repository<OrderItemOrm>,
  ) {}

  async create(order: Order): Promise<Order> {
    const orm = this.orderRepo.create({
      userId: order.userId,
      totalAmount: order.totalAmount,
      status: order.status,
      orderGroupId: order.orderGroupId,
      voucherId: (order as any).voucherId,
      discountAmount: (order as any).discountAmount,
      shippingFee: (order as any).shippingFee,
      items: order.items.map((i) =>
        this.itemRepo.create({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          sellerId: i.sellerId,
        }),
      ),
    });
    const saved = await this.orderRepo.save(orm);
    return ormToDomain(saved);
  }

  async findById(id: string): Promise<Order | null> {
    const orm = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
      select: [
        'id',
        'userId',
        'totalAmount',
        'status',
        'orderGroupId',
        'voucherId',
        'discountAmount',
        'shippingFee',
        'trackingNumber',
        'cancellationReason',
        'cancelledBy',
        'cancelledAt',
        'shippedAt',
        'deliveredAt',
        'createdAt',
        'updatedAt',
      ],
    });
    return orm ? ormToDomain(orm) : null;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.orderRepo.update(id, { status });
  }

  async updateCancellationInfo(orderId: string, reason?: string, cancelledBy?: string): Promise<void> {
    await this.orderRepo.update(orderId, {
      cancellationReason: reason,
      cancelledBy,
      cancelledAt: new Date(),
    });
  }

  async updateTrackingNumber(orderId: string, trackingNumber: string): Promise<void> {
    await this.orderRepo.update(orderId, { trackingNumber });
  }

  async updateShippedAt(orderId: string): Promise<void> {
    await this.orderRepo.update(orderId, { shippedAt: new Date() });
  }

  async updateDeliveredAt(orderId: string): Promise<void> {
    await this.orderRepo.update(orderId, { deliveredAt: new Date() });
  }
}


