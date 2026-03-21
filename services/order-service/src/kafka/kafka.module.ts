import { Global, Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { PaymentEventsConsumer } from './payment-events.consumer';
import { ShippingEventsConsumer } from './shipping-events.consumer';
import { TracingService } from '../common/tracing.service';
import { OrderModule } from '../modules/order/order.module';
import { KafkaRequestReplyService } from './request-reply.service';

@Global()
@Module({
  imports: [OrderModule],
  providers: [
    KafkaService,
    KafkaRequestReplyService,
    PaymentEventsConsumer,
    ShippingEventsConsumer,
    TracingService,
  ],
  exports: [KafkaService, KafkaRequestReplyService],
})
export class KafkaModule {}


