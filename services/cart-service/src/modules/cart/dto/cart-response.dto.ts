import { ApiProperty } from '@nestjs/swagger';

export class CartItemResponseDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'prod-001',
  })
  productId!: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
  })
  quantity!: number;

  @ApiProperty({
    description: 'Price of the product',
    example: 649500,
  })
  price!: number;
}

export class CartResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user-001',
  })
  userId!: string;

  @ApiProperty({
    description: 'Cart items',
    type: [CartItemResponseDto],
  })
  items!: CartItemResponseDto[];

  @ApiProperty({
    description: 'Cart creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Cart last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}

