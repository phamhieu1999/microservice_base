import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { InventoryService } from '../modules/inventory/inventory.service';
import { KafkaService } from './kafka.service';

const INVENTORY_RESERVE_REQUEST_TOPIC = 'inventory.reserve.request';
const INVENTORY_RESERVE_REPLY_TOPIC = 'inventory.reserve.reply';

interface ReserveStockRequestPayload {
  items: Array<{ productId: string; quantity: number }>;
}

@Injectable()
export class ReserveStockRequestConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReserveStockRequestConsumer.name);
  private consumer: Consumer | null = null;
  private readonly enabled = (process.env.KAFKA_ENABLED || 'true') !== 'false';

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly kafka: KafkaService,
  ) {}

  async onModuleInit() {
    if (!this.enabled) return;

    const kafka = new Kafka({
      clientId: 'product-service-reserve-request',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'product-service-reserve-request-group' });

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: INVENTORY_RESERVE_REQUEST_TOPIC, fromBeginning: false });
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          const correlationId = message.headers?.correlationId?.toString();
          const replyTopic = message.headers?.replyTopic?.toString() || INVENTORY_RESERVE_REPLY_TOPIC;
          if (!correlationId) {
            this.logger.warn('Missing correlationId in reserve request');
            return;
          }
          const raw = message.value?.toString();
          if (!raw) return;

          try {
            const payload = JSON.parse(raw) as ReserveStockRequestPayload;
            if (!payload.items?.length) {
              await this.kafka.emitWithHeaders(replyTopic, { correlationId, success: false, error: 'No items' }, { correlationId });
              return;
            }
            await this.inventoryService.reserveStockBatch(
              payload.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            );
            await this.kafka.emitWithHeaders(replyTopic, { correlationId, success: true }, { correlationId });
          } catch (err) {
            const errorMessage = (err as Error).message;
            this.logger.warn(`Reserve stock failed for ${correlationId}: ${errorMessage}`);
            await this.kafka.emitWithHeaders(replyTopic, { correlationId, success: false, error: errorMessage }, { correlationId });
          }
        },
      });
      this.logger.log(`ReserveStockRequestConsumer subscribed to ${INVENTORY_RESERVE_REQUEST_TOPIC}`);
    } catch (err) {
      this.logger.error(`ReserveStockRequestConsumer init failed: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
    }
  }
}
