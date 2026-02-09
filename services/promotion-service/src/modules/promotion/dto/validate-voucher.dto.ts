import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CartItemDto } from './cart-item.dto';

export class ValidateVoucherDto {
  @ApiProperty({ description: 'Voucher code', example: 'SUMMER2024' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: 'User ID', example: 'user-123' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Cart items', type: [CartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];
}


