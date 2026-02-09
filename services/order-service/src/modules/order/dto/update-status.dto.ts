import { IsIn, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../../database/entities/order.entity';

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'PAYMENT_EXPIRED',
  'BUYER_CANCEL_REQUESTED',
  'SELLER_CANCELLED',
  'SYSTEM_CANCELLED',
  'RETURN_REQUESTED',
  'RETURN_APPROVED',
  'RETURN_REJECTED',
  'RETURN_IN_TRANSIT',
  'RETURN_RECEIVED',
  'REFUND_PENDING',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
];

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;
}

