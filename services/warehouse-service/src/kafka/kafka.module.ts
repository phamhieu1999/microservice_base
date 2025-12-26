import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WarehouseConsumer } from './warehouse.consumer';
import { KafkaService } from './kafka.service';
import { KafkaPerformanceService } from './kafka-performance.service';

@Module({
  imports: [ConfigModule],
  providers: [KafkaService, KafkaPerformanceService, WarehouseConsumer],
  exports: [KafkaService, KafkaPerformanceService],
})
export class KafkaModule {}

