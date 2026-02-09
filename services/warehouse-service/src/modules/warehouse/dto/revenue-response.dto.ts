import { ApiProperty } from '@nestjs/swagger';

export class DailyRevenueItemDto {
  @ApiProperty({ example: '2024-01-15' })
  revenue_date: string;

  @ApiProperty({ example: 12500.50, description: 'Total revenue in the day' })
  total_revenue: number;

  @ApiProperty({ example: 45, description: 'Number of orders' })
  order_count: number;

  @ApiProperty({ example: 277.79, description: 'Average order value' })
  avg_order_value: number;

  @ApiProperty({ example: 'seller_1', required: false, description: 'Seller ID if filtered by seller' })
  seller_id?: string;
}

export class DailyRevenueResponseDto {
  @ApiProperty({ type: [DailyRevenueItemDto] })
  data: DailyRevenueItemDto[];

  @ApiProperty({ example: 30, description: 'Total number of records' })
  total: number;
}

