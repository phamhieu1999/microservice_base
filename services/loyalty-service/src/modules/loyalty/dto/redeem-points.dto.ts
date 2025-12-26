import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsOptional, IsString } from 'class-validator';

export class RedeemPointsDto {
  @ApiProperty({ description: 'Number of points to redeem', example: 1000 })
  @IsInt()
  @IsPositive()
  points: number;

  @ApiProperty({ description: 'Voucher ID if redeeming for voucher', required: false })
  @IsOptional()
  @IsString()
  voucherId?: string;

  @ApiProperty({ description: 'Description for the redemption', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

