import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiProperty({ description: 'Số tiền hoàn lại', example: 50000, minimum: 0 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ description: 'Lý do hoàn tiền', example: 'Khách hàng yêu cầu hủy đơn hàng' })
  @IsOptional()
  @IsString()
  reason?: string;
}

