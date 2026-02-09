import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { QueryRevenueDto } from './dto/query-revenue.dto';
import { DailyRevenueResponseDto } from './dto/revenue-response.dto';
import { TopSellerResponseDto } from './dto/top-seller.dto';
import { TopProductResponseDto } from './dto/top-product.dto';

@ApiTags('warehouse')
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('revenue/daily')
  @ApiOperation({ 
    summary: 'Get daily revenue statistics',
    description: 'Returns daily revenue aggregated by date. Can filter by seller ID. Uses materialized view for better performance when no seller filter is applied.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Daily revenue data',
    type: DailyRevenueResponseDto
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getDailyRevenue(@Query() query: QueryRevenueDto) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    
    const result = await this.warehouseService.getDailyRevenue(startDate, endDate, query.sellerId);
    const data = Array.isArray(result) ? result : ((result as any)?.data || []);
    
    return {
      data,
      total: data.length,
    };
  }

  @Get('sellers/top')
  @ApiOperation({ 
    summary: 'Get top sellers by revenue',
    description: 'Returns top sellers ranked by total revenue. Defaults to last 30 days if no date range is provided.'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top sellers to return (default: 10)', example: 10 })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)', example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)', example: '2024-12-31' })
  @ApiResponse({ 
    status: 200, 
    description: 'Top sellers data',
    type: TopSellerResponseDto
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTopSellers(
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const result = await this.warehouseService.getTopSellers(limitNum, start, end);
    const data = Array.isArray(result) ? result : ((result as any)?.data || []);
    
    return {
      data,
      total: data.length,
    };
  }

  @Get('products/top')
  @ApiOperation({ 
    summary: 'Get top products by revenue',
    description: 'Returns top products ranked by total revenue. Defaults to last 30 days if no date range is provided.'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top products to return (default: 10)', example: 10 })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)', example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)', example: '2024-12-31' })
  @ApiResponse({ 
    status: 200, 
    description: 'Top products data',
    type: TopProductResponseDto
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTopProducts(
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    const result = await this.warehouseService.getTopProducts(limitNum, start, end);
    const data = Array.isArray(result) ? result : ((result as any)?.data || []);
    
    return {
      data,
      total: data.length,
    };
  }
}

