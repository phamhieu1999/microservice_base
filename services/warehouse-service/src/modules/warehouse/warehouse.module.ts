import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { WarehouseConsumer } from '../../kafka/warehouse.consumer';
import { DatabaseModule } from '../../database/database.module';
import { KafkaModule } from '../../kafka/kafka.module';

@Module({
  imports: [ConfigModule, DatabaseModule, KafkaModule],
  controllers: [WarehouseController],
  providers: [WarehouseService, WarehouseConsumer],
  exports: [WarehouseService],
})
export class WarehouseModule {}

