import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderRepository } from '../../../domain/order/order.repository';
import { Order } from '../../../domain/order/order.entity';

@Injectable()
export class GetOrderUseCase {
  constructor(@Inject('IOrderRepository') private readonly repo: IOrderRepository) {}

  async execute(id: string): Promise<Order> {
    const order = await this.repo.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}


