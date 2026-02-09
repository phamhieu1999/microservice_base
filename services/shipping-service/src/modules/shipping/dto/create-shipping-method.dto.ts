import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ShippingMethodType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  SAME_DAY = 'SAME_DAY',
}

export enum ShippingMethodStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateShippingMethodDto {
  @ApiProperty({ description: 'Shipping method name', example: 'Standard Shipping' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Shipping method type', enum: ShippingMethodType, example: 'STANDARD' })
  @IsEnum(ShippingMethodType)
  type!: ShippingMethodType;

  @ApiProperty({ description: 'Base shipping fee', example: 15000, minimum: 0 })
  @IsNumber()
  @Min(0)
  baseFee!: number;

  @ApiPropertyOptional({ description: 'Fee per item', example: 2000, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  perItemFee?: number;

  @ApiPropertyOptional({ description: 'Fee per kg', example: 5000, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  perKgFee?: number;

  @ApiProperty({ description: 'Estimated delivery days', example: 3, minimum: 0, maximum: 30 })
  @IsNumber()
  @Min(0)
  @Max(30)
  estimatedDays!: number;

  @ApiPropertyOptional({ description: 'Status', enum: ShippingMethodStatus, default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(ShippingMethodStatus)
  status?: ShippingMethodStatus;

  @ApiPropertyOptional({ description: 'Description', example: 'Standard delivery within 3-5 business days' })
  @IsOptional()
  @IsString()
  description?: string;
}

