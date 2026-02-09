import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'iPhone 15 Pro', minLength: 3 })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiPropertyOptional({ description: 'Product description', example: 'Latest iPhone with A17 Pro chip' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Product price', example: 999.99, minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ description: 'Stock quantity', example: 100, minimum: 0 })
  @IsNumber()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ description: 'Product category', example: 'Electronics' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Product brand', example: 'Apple' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Seller ID', example: 'seller-123' })
  @IsOptional()
  @IsString()
  sellerId?: string;
}


