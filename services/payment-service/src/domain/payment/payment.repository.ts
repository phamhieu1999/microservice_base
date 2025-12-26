import { Payment, PaymentStatus } from './payment.entity';

export interface IPaymentRepository {
  create(orderId: string, amount: number): Promise<Payment>;
  updateStatus(id: string, status: PaymentStatus): Promise<void>;
}


