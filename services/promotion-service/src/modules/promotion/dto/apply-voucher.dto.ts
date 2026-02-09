import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyVoucherDto {
  @ApiProperty({ description: 'Voucher ID', example: 'voucher-uuid-123' })
  @IsString()
  @IsNotEmpty()
  voucherId!: string;

  @ApiProperty({ description: 'User ID', example: 'user-123' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}


