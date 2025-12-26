import { Module } from '@nestjs/common';
import { ProductEventsConsumer } from './product-events.consumer';
import { SearchModule } from '../modules/search/search.module';

@Module({
  imports: [SearchModule],
  providers: [ProductEventsConsumer],
})
export class KafkaModule {}

