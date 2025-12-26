import { Module } from '@nestjs/common';
import { WarehouseMonitorService } from './warehouse-monitor.service';
import { WarehouseMonitorController } from './warehouse-monitor.controller';
import { ClickHouseService } from '../database/clickhouse.service';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  controllers: [WarehouseMonitorController],
  providers: [WarehouseMonitorService, ClickHouseService],
  exports: [WarehouseMonitorService],
})
export class MonitoringModule {}

