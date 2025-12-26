import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { KafkaService } from '../../kafka/kafka.service';
import { ORDER_CREATED_TOPIC, OrderCreatedEvent } from './events/order-events';

@Injectable()
export class OrderService {
  constructor(
    private readonly repo: OrderRepository,
    private readonly kafka: KafkaService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const order = await this.repo.createOrder(userId, dto);
    const event: OrderCreatedEvent = {
      id: order.id,
      userId: order.userId,
      totalAmount: Number(order.totalAmount),
    };
    await this.kafka.emit(ORDER_CREATED_TOPIC, event);
    return order;
  }

  async findById(id: string) {
    const order = await this.repo.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async markPaid(orderId: string) {
    const order = await this.repo.findById(orderId);
    if (!order) return;
    await this.repo.updateStatus(orderId, 'PAID');
  }

  async markCancelled(orderId: string, _reason?: string) {
    const order = await this.repo.findById(orderId);
    if (!order) return;
    await this.repo.updateStatus(orderId, 'CANCELLED');
  }
}


