import { Module } from '@nestjs/common';
import { OrderEventsConsumer } from './order-events.consumer';
import { ChatModule } from '../modules/chat/chat.module';

@Module({
  imports: [ChatModule],
  providers: [OrderEventsConsumer],
})
export class KafkaModule {}

