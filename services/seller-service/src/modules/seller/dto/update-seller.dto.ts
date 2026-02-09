import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SellerStatus } from '../../../database/entities/seller.entity';

export class UpdateSellerDto {
  @ApiProperty({
    description: 'Seller status',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    example: 'APPROVED',
  })
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED'])
  status!: SellerStatus;
}

