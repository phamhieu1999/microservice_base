import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { MarkPaidUseCase } from '../application/order/use-cases/mark-paid.usecase';
import { MarkCancelledUseCase } from '../application/order/use-cases/mark-cancelled.usecase';

@Injectable()
export class PaymentEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(PaymentEventsConsumer.name);
  private readonly consumer: Consumer;

  constructor(
    private readonly markPaid: MarkPaidUseCase,
    private readonly markCancelled: MarkCancelledUseCase,
  ) {
    const kafka = new Kafka({
      clientId: 'order-service-consumer',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'order-service-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'payment.success', fromBeginning: true });
    await this.consumer.subscribe({ topic: 'payment.failed', fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const payload = message.value ? JSON.parse(message.value.toString()) : null;
        if (!payload) return;
        try {
          if (topic === 'payment.success') {
            await this.markPaid.execute(payload.orderId);
          } else if (topic === 'payment.failed') {
            await this.markCancelled.execute(payload.orderId);
          }
        } catch (err) {
          this.logger.error(`Error handling ${topic} event`, err as Error);
        }
      },
    });
  }
}


