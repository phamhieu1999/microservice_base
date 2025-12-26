import { Module, forwardRef } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ProductModule } from '../product/product.module';
import { KafkaModule } from '../../kafka/kafka.module';

@Module({
  imports: [forwardRef(() => ProductModule), KafkaModule],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}


