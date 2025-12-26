import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    const order = new Order();
    order.userId = userId;
    order.totalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    order.items = dto.items.map((i) => {
      const item = new OrderItem();
      item.productId = i.productId;
      item.quantity = i.quantity;
      item.unitPrice = i.unitPrice;
       item.sellerId = (i as any).sellerId;
      return item;
    });
    return this.orderRepo.save(order);
  }

  findById(id: string): Promise<Order | null> {
    return this.orderRepo.findOne({ where: { id }, relations: ['items'] });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.orderRepo.update(id, { status } as any);
  }
}


