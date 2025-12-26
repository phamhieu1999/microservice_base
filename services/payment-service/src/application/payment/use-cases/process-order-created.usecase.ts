// Skeleton use case: ủy quyền sang PaymentService cũ để giữ nguyên logic.
import { Injectable } from '@nestjs/common';
import { PaymentService } from '../../../modules/payment/payment.service';
import { OrderCreatedEvent } from '../../../modules/payment/types/order-created-event.type';

@Injectable()
export class ProcessOrderCreatedUseCase {
  constructor(private readonly paymentService: PaymentService) {}

  execute(event: OrderCreatedEvent) {
    return this.paymentService.processOrderCreated(event);
  }
}


