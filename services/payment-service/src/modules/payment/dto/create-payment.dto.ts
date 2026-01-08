import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentProvider, PaymentMethodEnum, PaymentProviderEnum } from '../../../database/entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID cần thanh toán', example: 'order-123' })
  @IsString()
  orderId!: string;

  @ApiProperty({ description: 'Số tiền thanh toán', example: 100000, minimum: 0 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ description: 'Phương thức thanh toán', enum: PaymentMethodEnum, example: 'CARD' })
  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  method?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment provider', enum: PaymentProviderEnum, example: 'VNPAY' })
  @IsOptional()
  @IsEnum(PaymentProviderEnum)
  provider?: PaymentProvider;

  @ApiPropertyOptional({ description: 'Idempotency key để tránh duplicate payment', example: 'unique-key-123' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Mô tả payment', example: 'Thanh toán đơn hàng #123' })
  @IsOptional()
  @IsString()
  description?: string;
}

