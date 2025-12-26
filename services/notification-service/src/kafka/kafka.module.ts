import { Global, Module } from '@nestjs/common';
import { NotificationConsumer } from './notification.consumer';
import { NotificationModule } from '../modules/notification/notification.module';

@Global()
@Module({
  imports: [NotificationModule],
  providers: [NotificationConsumer],
})
export class KafkaModule {}


