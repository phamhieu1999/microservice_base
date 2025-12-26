import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { ClickHouseService } from '../../database/clickhouse.service';
import { KafkaModule } from '../../kafka/kafka.module';

@Module({
  imports: [ConfigModule, KafkaModule],
  controllers: [WarehouseController],
  providers: [WarehouseService, ClickHouseService],
  exports: [WarehouseService],
})
export class WarehouseModule {}

