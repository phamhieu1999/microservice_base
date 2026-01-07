import { IsNumber, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CartItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'prod-001',
  })
  @IsString()
  productId!: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty({
    description: 'Price of the product',
    example: 649500,
    minimum: 0,
  })
  @IsNumber()
  @IsPositive()
  price!: number;
}

