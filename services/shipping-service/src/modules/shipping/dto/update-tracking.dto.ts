import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ShippingOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export class UpdateTrackingDto {
  @ApiProperty({ description: 'Tracking status', enum: ShippingOrderStatus, example: 'IN_TRANSIT' })
  @IsEnum(ShippingOrderStatus)
  status!: ShippingOrderStatus;

  @ApiPropertyOptional({ description: 'Current location', example: 'Ho Chi Minh City Distribution Center' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Tracking note', example: 'Package is in transit' })
  @IsOptional()
  @IsString()
  note?: string;
}

