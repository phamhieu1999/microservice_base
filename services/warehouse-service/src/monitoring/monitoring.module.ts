import { Module } from '@nestjs/common';
import { WarehouseMonitorService } from './warehouse-monitor.service';
import { WarehouseMonitorController } from './warehouse-monitor.controller';
import { DatabaseModule } from '../database/database.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [DatabaseModule, KafkaModule],
  controllers: [WarehouseMonitorController],
  providers: [WarehouseMonitorService],
  exports: [WarehouseMonitorService],
})
export class MonitoringModule {}

