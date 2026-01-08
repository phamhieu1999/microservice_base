import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsProxyService } from './analytics-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsProxyController {
  constructor(private readonly analyticsService: AnalyticsProxyService) {}

  @Get('revenue')
  @ApiOperation({
    summary: 'Get revenue analytics',
    description: 'Lấy dữ liệu phân tích doanh thu theo khoảng thời gian',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Ngày bắt đầu (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Ngày kết thúc (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'weekly', 'monthly'],
    description: 'Chu kỳ phân tích (default: daily)',
  })
  @ApiResponse({ status: 200, description: 'Revenue analytics data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Analytics service is temporarily unavailable' })
  getRevenue(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
  ) {
    return this.analyticsService.getRevenueByPeriod(startDate, endDate, period);
  }

  @Get('revenue/total')
  @ApiOperation({
    summary: 'Get total revenue summary',
    description: 'Lấy tổng doanh thu trong khoảng thời gian',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Ngày bắt đầu (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Ngày kết thúc (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @ApiResponse({ status: 200, description: 'Total revenue summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Analytics service is temporarily unavailable' })
  getTotalRevenue(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getTotalRevenue(startDate, endDate);
  }

  @Get('products/top')
  @ApiOperation({
    summary: 'Get top products',
    description: 'Lấy danh sách sản phẩm bán chạy nhất',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng sản phẩm (default: 10)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['sales', 'revenue'],
    description: 'Sắp xếp theo (default: sales)',
  })
  @ApiResponse({ status: 200, description: 'Top products list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Analytics service is temporarily unavailable' })
  getTopProducts(
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'sales' | 'revenue',
  ) {
    return this.analyticsService.getTopProducts(
      limit ? parseInt(limit, 10) : undefined,
      sortBy,
    );
  }

  @Get('products/:productId')
  @ApiOperation({
    summary: 'Get product metrics',
    description: 'Lấy thông tin phân tích chi tiết của một sản phẩm',
  })
  @ApiParam({ name: 'productId', description: 'Product ID', type: String })
  @ApiResponse({ status: 200, description: 'Product metrics' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Analytics service is temporarily unavailable' })
  getProductMetrics(@Param('productId') productId: string) {
    return this.analyticsService.getProductMetrics(productId);
  }

  @Get('products/category/:category')
  @ApiOperation({
    summary: 'Get products by category',
    description: 'Lấy danh sách sản phẩm theo danh mục',
  })
  @ApiParam({ name: 'category', description: 'Category name', type: String })
  @ApiResponse({ status: 200, description: 'Products by category' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Analytics service is temporarily unavailable' })
  getProductsByCategory(@Param('category') category: string) {
    return this.analyticsService.getProductsByCategory(category);
  }

  @Get('products/seller/:sellerId')
  @ApiOperation({
    summary: 'Get products by seller',
    description: 'Lấy danh sách sản phẩm của một seller',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID', type: String })
  @ApiResponse({ status: 200, description: 'Products by seller' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Analytics service is temporarily unavailable' })
  getProductsBySeller(@Param('sellerId') sellerId: string) {
    return this.analyticsService.getProductsBySeller(sellerId);
  }

  @Get('users')
  @ApiOperation({
    summary: 'Get user analytics',
    description: 'Lấy dữ liệu phân tích người dùng theo khoảng thời gian',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Ngày bắt đầu (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Ngày kết thúc (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @ApiResponse({ status: 200, description: 'User analytics data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Analytics service is temporarily unavailable' })
  getUserMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getUserMetrics(startDate, endDate);
  }

  @Get('users/dau')
  @ApiOperation({
    summary: 'Get Daily Active Users',
    description: 'Lấy số lượng người dùng hoạt động trong ngày (DAU)',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'Ngày cần kiểm tra (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @ApiResponse({ status: 200, description: 'DAU count' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Analytics service is temporarily unavailable' })
  getDAU(@Query('date') date: string) {
    return this.analyticsService.getDAU(date);
  }

  @Get('users/mau')
  @ApiOperation({
    summary: 'Get Monthly Active Users',
    description: 'Lấy số lượng người dùng hoạt động trong tháng (MAU)',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Năm',
    example: 2024,
  })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
    description: 'Tháng (1-12)',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'MAU count' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Analytics service is temporarily unavailable' })
  getMAU(@Query('year') year: string, @Query('month') month: string) {
    return this.analyticsService.getMAU(parseInt(year, 10), parseInt(month, 10));
  }
}

