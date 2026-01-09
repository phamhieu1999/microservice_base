import { ApiProperty } from '@nestjs/swagger';

export class TopProductDto {
  @ApiProperty({ example: 'product_1' })
  product_id: string;

  @ApiProperty({ example: 25000.50, description: 'Total revenue' })
  total_revenue: number;

  @ApiProperty({ example: 75, description: 'Number of orders' })
  order_count: number;
}

export class TopProductResponseDto {
  @ApiProperty({ type: [TopProductDto] })
  data: TopProductDto[];

  @ApiProperty({ example: 10, description: 'Number of products returned' })
  total: number;
}

