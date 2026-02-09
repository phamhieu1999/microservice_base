import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'] })
  @ApiResponse({ status: 200, description: 'Revenue analytics' })
  async getRevenue(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    return this.analyticsService.getRevenueByPeriod(
      new Date(startDate),
      new Date(endDate),
      period,
    );
  }

  @Get('revenue/total')
  @ApiOperation({ summary: 'Get total revenue summary' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Total revenue summary' })
  async getTotalRevenue(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getTotalRevenue(new Date(startDate), new Date(endDate));
  }

  @Get('products/top')
  @ApiOperation({ summary: 'Get top products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['sales', 'revenue'] })
  @ApiResponse({ status: 200, description: 'Top products' })
  async getTopProducts(
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'sales' | 'revenue',
  ) {
    return this.analyticsService.getTopProducts(
      limit ? parseInt(limit, 10) : 10,
      sortBy || 'sales',
    );
  }

  @Get('products/:productId')
  @ApiOperation({ summary: 'Get product metrics' })
  @ApiResponse({ status: 200, description: 'Product metrics' })
  async getProductMetrics(@Param('productId') productId: string) {
    return this.analyticsService.getProductMetrics(productId);
  }

  @Get('products/category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({ status: 200, description: 'Products by category' })
  async getProductsByCategory(@Param('category') category: string) {
    return this.analyticsService.getProductsByCategory(category);
  }

  @Get('products/seller/:sellerId')
  @ApiOperation({ summary: 'Get products by seller' })
  @ApiResponse({ status: 200, description: 'Products by seller' })
  async getProductsBySeller(@Param('sellerId') sellerId: string) {
    return this.analyticsService.getProductsBySeller(sellerId);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'User analytics' })
  async getUserMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getUserMetrics(new Date(startDate), new Date(endDate));
  }

  @Get('users/dau')
  @ApiOperation({ summary: 'Get Daily Active Users' })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiResponse({ status: 200, description: 'DAU count' })
  async getDAU(@Query('date') date: string) {
    const dau = await this.analyticsService.getDAU(new Date(date));
    return { date, dau };
  }

  @Get('users/mau')
  @ApiOperation({ summary: 'Get Monthly Active Users' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'MAU count' })
  async getMAU(@Query('year') year: string, @Query('month') month: string) {
    const mau = await this.analyticsService.getMAU(parseInt(year, 10), parseInt(month, 10));
    return { year: parseInt(year, 10), month: parseInt(month, 10), mau };
  }
}

