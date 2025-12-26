import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WarehouseProxyService } from './warehouse-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('warehouse')
@Controller('warehouse')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WarehouseProxyController {
  constructor(private readonly warehouseProxyService: WarehouseProxyService) {}

  @Get('revenue/daily')
  @Roles('ADMIN', 'SELLER')
  @ApiOperation({ summary: 'Get daily revenue (Admin/Seller only)' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'sellerId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Daily revenue data' })
  async getDailyRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.warehouseProxyService.getDailyRevenue(startDate, endDate, sellerId);
  }

  @Get('sellers/top')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get top sellers (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Top sellers data' })
  async getTopSellers(
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.warehouseProxyService.getTopSellers(limitNum, startDate, endDate);
  }

  @Get('products/top')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get top products (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Top products data' })
  async getTopProducts(
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.warehouseProxyService.getTopProducts(limitNum, startDate, endDate);
  }
}

