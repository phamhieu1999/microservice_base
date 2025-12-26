import { Global, Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { PaymentEventsConsumer } from './payment-events.consumer';
import { TracingService } from '../common/tracing.service';

@Global()
@Module({
  providers: [KafkaService, PaymentEventsConsumer, TracingService],
  exports: [KafkaService],
})
export class KafkaModule {}


