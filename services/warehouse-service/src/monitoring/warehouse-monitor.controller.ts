import { Controller, Get, Query, Param } from '@nestjs/common';
import { WarehouseMonitorService } from './warehouse-monitor.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Monitoring')
@Controller('monitoring')
export class WarehouseMonitorController {
  constructor(private readonly monitorService: WarehouseMonitorService) {}

  @Get('health')
  @ApiOperation({ summary: 'Get system health metrics' })
  async getHealth() {
    return await this.monitorService.getHealthMetrics();
  }

  @Get('kafka/lag')
  @ApiOperation({ summary: 'Get Kafka consumer lag' })
  @ApiQuery({ name: 'groupId', required: false, description: 'Consumer group ID' })
  async getConsumerLag(@Query('groupId') groupId?: string) {
    return await this.monitorService.getConsumerLag(groupId);
  }

  @Get('clickhouse/queries')
  @ApiOperation({ summary: 'Get ClickHouse query performance stats' })
  @ApiQuery({ name: 'hours', required: false, description: 'Hours to look back', type: Number })
  async getQueryStats(@Query('hours') hours?: number) {
    return await this.monitorService.getQueryStats(hours || 1);
  }

  @Get('clickhouse/tables')
  @ApiOperation({ summary: 'Get ClickHouse table sizes' })
  async getTableSizes() {
    return await this.monitorService.getTableSizes();
  }

  @Get('clickhouse/partitions/:table')
  @ApiOperation({ summary: 'Get partition info for a table' })
  async getPartitionInfo(@Param('table') table: string) {
    return await this.monitorService.getPartitionInfo(table);
  }

  @Get('clickhouse/inserts/:table')
  @ApiOperation({ summary: 'Get recent insert stats for a table' })
  @ApiQuery({ name: 'hours', required: false, description: 'Hours to look back', type: Number })
  async getRecentInserts(
    @Param('table') table: string,
    @Query('hours') hours?: number,
  ) {
    return await this.monitorService.getRecentInsertStats(table, hours || 24);
  }
}

