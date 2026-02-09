import { ApiProperty } from '@nestjs/swagger';

export class TopSellerDto {
  @ApiProperty({ example: 'seller_1' })
  seller_id: string;

  @ApiProperty({ example: 50000.75, description: 'Total revenue' })
  total_revenue: number;

  @ApiProperty({ example: 150, description: 'Number of orders' })
  order_count: number;

  @ApiProperty({ example: 333.34, description: 'Average order value' })
  avg_order_value: number;
}

export class TopSellerResponseDto {
  @ApiProperty({ type: [TopSellerDto] })
  data: TopSellerDto[];

  @ApiProperty({ example: 10, description: 'Number of sellers returned' })
  total: number;
}

