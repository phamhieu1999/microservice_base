import { ApiProperty } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty({
    description: 'Review ID',
    example: '507f1f77bcf86cd799439011',
  })
  _id!: string;

  @ApiProperty({
    description: 'Product ID',
    example: 'prod-001',
  })
  productId!: string;

  @ApiProperty({
    description: 'User ID who created the review',
    example: 'user-001',
  })
  userId!: string;

  @ApiProperty({
    description: 'Rating from 1 to 5',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  rating!: number;

  @ApiProperty({
    description: 'Review content/comment',
    example: 'Sản phẩm rất tốt, đáng mua!',
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: 'Review creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Review last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}

