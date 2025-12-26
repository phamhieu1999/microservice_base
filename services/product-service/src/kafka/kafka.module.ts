import { Global, Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { DeadLetterQueueService } from './dlq.service';

@Global()
@Module({
  providers: [KafkaService, DeadLetterQueueService],
  exports: [KafkaService, DeadLetterQueueService],
})
export class KafkaModule {}


