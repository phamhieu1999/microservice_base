import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { LoyaltyService } from '../modules/loyalty/loyalty.service';
import { PAYMENT_SUCCESS_TOPIC } from '../../payment-service-placeholder';

@Injectable()
export class PaymentEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(PaymentEventsConsumer.name);
  private readonly consumer: Consumer;

  constructor(private readonly loyaltyService: LoyaltyService) {
    const kafka = new Kafka({
      clientId: 'loyalty-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'loyalty-service-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'payment.success', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const payload = message.value ? JSON.parse(message.value.toString()) : null;
        if (!payload) return;

        try {
          await this.handleEvent(topic, payload);
        } catch (err) {
          this.logger.error(`Error handling ${topic}`, err as Error);
        }
      },
    });
  }

  private async handleEvent(topic: string, payload: any) {
    switch (topic) {
      case 'payment.success':
        if (payload.userId && payload.amount) {
          await this.loyaltyService.earnPointsForPayment(
            payload.userId,
            payload.orderId,
            payload.amount,
          );
          this.logger.log(`Earned points for user ${payload.userId} from order ${payload.orderId}`);
        }
        break;
    }
  }
}
