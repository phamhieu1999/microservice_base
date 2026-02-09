import { ApiProperty } from '@nestjs/swagger';

export class ReviewStatsDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'prod-001',
  })
  productId!: string;

  @ApiProperty({
    description: 'Total number of reviews',
    example: 150,
  })
  totalReviews!: number;

  @ApiProperty({
    description: 'Average rating',
    example: 4.5,
  })
  averageRating!: number;

  @ApiProperty({
    description: 'Rating distribution',
    example: {
      1: 5,
      2: 10,
      3: 20,
      4: 50,
      5: 65,
    },
  })
  ratingDistribution!: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

