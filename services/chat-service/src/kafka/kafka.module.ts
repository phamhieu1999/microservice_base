import { Module } from '@nestjs/common';
import { OrderEventsConsumer } from './order-events.consumer';

@Module({
  providers: [OrderEventsConsumer],
})
export class KafkaModule {}

