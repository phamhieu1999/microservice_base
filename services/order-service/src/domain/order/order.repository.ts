import { Order, OrderStatus } from './order.entity';

export interface IOrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
  updateCancellationInfo(orderId: string, reason?: string, cancelledBy?: string): Promise<void>;
  updateTrackingNumber(orderId: string, trackingNumber: string): Promise<void>;
  updateShippedAt(orderId: string): Promise<void>;
  updateDeliveredAt(orderId: string): Promise<void>;
}


