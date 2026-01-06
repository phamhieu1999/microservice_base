import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WarehouseModule } from './warehouse/warehouse.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { HealthController } from '../common/health.controller';
import { HealthCheckService } from '../common/health-check.service';
import { DatabaseModule } from '../database/database.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    WarehouseModule,
    MonitoringModule,
    KafkaModule,
  ],
  controllers: [HealthController],
  providers: [HealthCheckService],
})
export class AppModule {}

