import { Global, Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { OrderEventsConsumer } from './order-events.consumer';
import { PaymentModule } from '../modules/payment/payment.module';

@Global()
@Module({
  imports: [PaymentModule],
  providers: [KafkaService, OrderEventsConsumer],
  exports: [KafkaService],
})
export class KafkaModule {}


