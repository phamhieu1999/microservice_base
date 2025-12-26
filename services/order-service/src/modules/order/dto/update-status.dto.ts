import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../../database/entities/order.entity';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;
}

