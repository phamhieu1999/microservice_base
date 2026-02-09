import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { ORDER_PREPARE_REQUEST_TOPIC, ORDER_PREPARE_REPLY_TOPIC } from './request-reply.constants';
import { KafkaService } from './kafka.service';

const RESPONDER_ID = 'promotion-service';

@Injectable()
export class OrderPrepareRequestConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderPrepareRequestConsumer.name);
  private consumer: Consumer | null = null;
  private readonly enabled = (process.env.KAFKA_ENABLED || 'true') !== 'false';

  constructor(private readonly kafka: KafkaService) {}

  async onModuleInit() {
    if (!this.enabled) return;

    const kafka = new Kafka({
      clientId: 'promotion-service-order-prepare',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'promotion-service-order-prepare-group' });

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: ORDER_PREPARE_REQUEST_TOPIC, fromBeginning: false });
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          const correlationId = message.headers?.correlationId?.toString();
          const replyTopic = message.headers?.replyTopic?.toString() || ORDER_PREPARE_REPLY_TOPIC;
          if (!correlationId) return;

          try {
            await this.kafka.emitWithHeaders(
              replyTopic,
              { correlationId, responderId: RESPONDER_ID, success: true, data: {} },
              { correlationId },
            );
          } catch (err) {
            this.logger.warn(`Order prepare reply failed: ${(err as Error).message}`);
            await this.kafka.emitWithHeaders(
              replyTopic,
              { correlationId, responderId: RESPONDER_ID, success: false, error: (err as Error).message },
              { correlationId },
            );
          }
        },
      });
      this.logger.log(`OrderPrepareRequestConsumer subscribed to ${ORDER_PREPARE_REQUEST_TOPIC}`);
    } catch (err) {
      this.logger.error(`OrderPrepareRequestConsumer init failed: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
    }
  }
}
