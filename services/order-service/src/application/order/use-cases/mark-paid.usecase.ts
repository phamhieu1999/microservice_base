import { Inject, Injectable } from '@nestjs/common';
import { IOrderRepository } from '../../../domain/order/order.repository';

@Injectable()
export class MarkPaidUseCase {
  constructor(@Inject('IOrderRepository') private readonly repo: IOrderRepository) {}

  async execute(orderId: string): Promise<void> {
    await this.repo.updateStatus(orderId, 'PAID');
  }
}


