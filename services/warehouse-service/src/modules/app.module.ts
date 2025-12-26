import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WarehouseModule } from './warehouse/warehouse.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { HealthController } from '../common/health.controller';
import { HealthCheckService } from '../common/health-check.service';
import { ClickHouseService } from '../database/clickhouse.service';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WarehouseModule,
    MonitoringModule,
    KafkaModule,
  ],
  controllers: [HealthController],
  providers: [HealthCheckService, ClickHouseService],
})
export class AppModule {}

