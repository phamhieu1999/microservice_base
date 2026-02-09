import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShippingItemDto {
  @ApiProperty({ description: 'Product ID', example: 'product-123' })
  @IsString()
  productId!: string;

  @ApiPropertyOptional({ description: 'Seller ID', example: 'seller-456' })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiProperty({ description: 'Product price', example: 100000, minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ description: 'Quantity', example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ description: 'Weight in kg', example: 1.5, minimum: 0 })
  @IsOptional()
  @IsNumber()
  weight?: number;
}


