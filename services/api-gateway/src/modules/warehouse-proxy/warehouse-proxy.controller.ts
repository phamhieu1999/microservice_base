import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WarehouseProxyService } from './warehouse-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('warehouse')
@Controller('warehouse')
export class WarehouseProxyController {
  constructor(private readonly warehouseProxyService: WarehouseProxyService) {}

  @Get('revenue/daily')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
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

  /**
   * =========================
   * Health endpoints (warehouse)
   * =========================
   */

  @Get('health')
  @ApiOperation({ summary: 'Warehouse service health (Public)' })
  @ApiResponse({ status: 200, description: 'Warehouse service health status' })
  async getWarehouseHealth() {
    return this.warehouseProxyService.getServiceHealth();
  }

  @Get('health/clickhouse')
  @ApiOperation({ summary: 'Warehouse ClickHouse health (Public)' })
  @ApiResponse({ status: 200, description: 'Warehouse ClickHouse health status' })
  async getWarehouseClickhouseHealth() {
    return this.warehouseProxyService.getClickhouseHealth();
  }

  @Get('health/kafka')
  @ApiOperation({ summary: 'Warehouse Kafka health (Public)' })
  @ApiResponse({ status: 200, description: 'Warehouse Kafka health status' })
  async getWarehouseKafkaHealth() {
    return this.warehouseProxyService.getKafkaHealth();
  }

  /**
   * =========================
   * Monitoring endpoints (warehouse)
   * =========================
   */

  @Get('monitoring/health')
  @ApiOperation({ summary: 'Warehouse monitoring health metrics (Public)' })
  @ApiResponse({ status: 200, description: 'Warehouse monitoring health metrics' })
  async getWarehouseMonitoringHealth() {
    return this.warehouseProxyService.getMonitoringHealth();
  }

  @Get('monitoring/kafka/lag')
  @ApiOperation({ summary: 'Warehouse Kafka consumer lag (Public)' })
  @ApiQuery({ name: 'groupId', required: false, description: 'Consumer group ID' })
  @ApiResponse({ status: 200, description: 'Warehouse Kafka lag metrics' })
  async getWarehouseKafkaLag(@Query('groupId') groupId?: string) {
    return this.warehouseProxyService.getKafkaLag(groupId);
  }

  @Get('monitoring/clickhouse/queries')
  @ApiOperation({ summary: 'Warehouse ClickHouse query performance (Public)' })
  @ApiQuery({ name: 'hours', required: false, type: Number, description: 'Hours to look back' })
  @ApiResponse({ status: 200, description: 'Warehouse ClickHouse query stats' })
  async getWarehouseClickhouseQueries(@Query('hours') hours?: string) {
    const hoursNum = hours ? parseInt(hours, 10) : undefined;
    return this.warehouseProxyService.getClickhouseQueryStats(hoursNum);
  }

  @Get('monitoring/clickhouse/tables')
  @ApiOperation({ summary: 'Warehouse ClickHouse table sizes (Public)' })
  @ApiResponse({ status: 200, description: 'Warehouse ClickHouse table sizes' })
  async getWarehouseClickhouseTables() {
    return this.warehouseProxyService.getClickhouseTableSizes();
  }

  @Get('monitoring/clickhouse/partitions/:table')
  @ApiOperation({ summary: 'Warehouse ClickHouse partition info (Public)' })
  @ApiResponse({ status: 200, description: 'Warehouse ClickHouse partition info' })
  async getWarehouseClickhousePartitions(@Param('table') table: string) {
    return this.warehouseProxyService.getClickhousePartitionInfo(table);
  }

  @Get('monitoring/clickhouse/inserts/:table')
  @ApiOperation({ summary: 'Warehouse ClickHouse recent inserts (Public)' })
  @ApiQuery({
    name: 'hours',
    required: false,
    type: Number,
    description: 'Hours to look back (default 24)',
  })
  @ApiResponse({ status: 200, description: 'Warehouse ClickHouse recent insert stats' })
  async getWarehouseClickhouseInserts(
    @Param('table') table: string,
    @Query('hours') hours?: string,
  ) {
    const hoursNum = hours ? parseInt(hours, 10) : undefined;
    return this.warehouseProxyService.getClickhouseRecentInserts(table, hoursNum);
  }
}

