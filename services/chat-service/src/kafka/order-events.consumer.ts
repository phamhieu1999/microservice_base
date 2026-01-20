import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { ChatService } from '../modules/chat/chat.service';

@Injectable()
export class OrderEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderEventsConsumer.name);
  private readonly consumer: Consumer;
  private readonly enabled = (process.env.KAFKA_ENABLED || 'true') !== 'false';

  constructor(private readonly chatService: ChatService) {
    const kafka = new Kafka({
      clientId: 'chat-service-consumer',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'chat-service-group' });
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('Kafka disabled (KAFKA_ENABLED=false), skip consumer connection');
      return;
    }

    // Retry logic với exponential backoff
    const maxRetries = 5;
    let retryCount = 0;
    let connected = false;

    while (retryCount < maxRetries && !connected) {
      try {
        await this.consumer.connect();
        await this.consumer.subscribe({ topic: 'order.created', fromBeginning: true });

        await this.consumer.run({
          eachMessage: async ({ message }) => {
            const payload = message.value ? JSON.parse(message.value.toString()) : null;
            if (!payload) return;

            try {
              // Auto tạo conversation giữa buyer và seller khi có order mới
              if (payload.userId && payload.sellerId) {
                await this.chatService.getOrCreateConversation(payload.userId, payload.sellerId);
                this.logger.log(
                  `Auto created conversation: buyer=${payload.userId}, seller=${payload.sellerId}`,
                );
              }
            } catch (err) {
              this.logger.error('Error handling order.created event', err as Error);
            }
          },
        });
        connected = true;
        this.logger.log('Kafka consumer connected and subscribed to order.created');
      } catch (err) {
        retryCount++;
        if (retryCount < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
          this.logger.warn(
            `Kafka consumer connect failed (attempt ${retryCount}/${maxRetries}): ${(err as Error).message}. Retrying in ${backoffMs}ms...`,
          );
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        } else {
          this.logger.error(
            `Kafka consumer connect failed after ${maxRetries} attempts: ${(err as Error).message}. Service will continue without Kafka consumer.`,
          );
          // Không throw error để service vẫn có thể khởi động
        }
      }
    }
  }

  async onModuleDestroy() {
    if (!this.enabled) return;
    try {
      await this.consumer.disconnect();
      this.logger.log('Kafka consumer disconnected');
    } catch (err) {
      this.logger.error(`Error disconnecting Kafka consumer: ${(err as Error).message}`);
    }
  }
}

