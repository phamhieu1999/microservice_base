import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CartItemDto {
  @ApiProperty({ description: 'Product ID', example: 'product-123' })
  @IsString()
  productId!: string;

  @ApiProperty({ description: 'Seller ID', example: 'seller-123', required: false })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiProperty({ description: 'Item price', example: 100000, minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ description: 'Item quantity', example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;
}


