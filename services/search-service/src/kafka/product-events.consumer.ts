import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { SearchService } from '../modules/search/search.service';

@Injectable()
export class ProductEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(ProductEventsConsumer.name);
  private readonly consumer: Consumer;

  constructor(private readonly searchService: SearchService) {
    const kafka = new Kafka({
      clientId: 'search-service-consumer',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'search-service-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'product.created', fromBeginning: true });
    await this.consumer.subscribe({ topic: 'product.updated', fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const payload = message.value ? JSON.parse(message.value.toString()) : null;
        if (!payload) return;

        try {
          if (topic === 'product.created' || topic === 'product.updated') {
            await this.searchService.indexProduct({
              id: payload.id,
              name: payload.name || '',
              description: payload.description,
              price: payload.price || 0,
              stock: payload.stock || 0,
              category: payload.category,
              brand: payload.brand,
              sellerId: payload.sellerId,
            });
            this.logger.log(`Indexed product: ${payload.id} from ${topic}`);
          }
        } catch (err) {
          this.logger.error(`Error handling ${topic}`, err as Error);
        }
      },
    });
  }
}

