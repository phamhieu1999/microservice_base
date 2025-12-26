import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { ChatService } from '../modules/chat/chat.service';

@Injectable()
export class OrderEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(OrderEventsConsumer.name);
  private readonly consumer: Consumer;

  constructor(private readonly chatService: ChatService) {
    const kafka = new Kafka({
      clientId: 'chat-service-consumer',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'chat-service-group' });
  }

  async onModuleInit() {
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
  }
}

