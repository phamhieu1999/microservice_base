import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { KafkaPerformanceService } from './kafka-performance.service';

@Module({
  imports: [ConfigModule],
  providers: [KafkaService, KafkaPerformanceService],
  exports: [KafkaService, KafkaPerformanceService],
})
export class KafkaModule {}

