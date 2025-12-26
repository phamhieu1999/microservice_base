import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { ProcessOrderCreatedUseCase } from '../application/payment/use-cases/process-order-created.usecase';

@Injectable()
export class OrderEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(OrderEventsConsumer.name);
  private readonly consumer: Consumer;

  constructor(private readonly processOrderCreated: ProcessOrderCreatedUseCase) {
    const kafka = new Kafka({
      clientId: 'payment-service-consumer',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'payment-service-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'order.created', fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const payload = message.value ? JSON.parse(message.value.toString()) : null;
        if (!payload) return;
        try {
          await this.processOrderCreated.execute(payload);
        } catch (err) {
          this.logger.error('Error handling order.created event', err as Error);
        }
      },
    });
  }
}


