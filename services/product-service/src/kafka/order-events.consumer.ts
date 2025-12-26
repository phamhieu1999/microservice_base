import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { InventoryService } from '../modules/inventory/inventory.service';
import { DeadLetterQueueService } from './dlq.service';

interface OrderCreatedEvent {
  id: string;
  userId: string;
  totalAmount: number;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
}

interface OrderCancelledEvent {
  id: string;
  userId: string;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
}

@Injectable()
export class OrderEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderEventsConsumer.name);
  private readonly consumer: Consumer;
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly dlqService: DeadLetterQueueService,
  ) {
    const kafka = new Kafka({
      clientId: 'product-service-consumer',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'product-service-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'order.created', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'order.cancelled', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const payload = message.value ? JSON.parse(message.value.toString()) : null;
        if (!payload) return;

        const offset = message.offset;
        const key = message.key?.toString();

        try {
          if (topic === 'order.created') {
            await this.handleOrderCreated(payload as OrderCreatedEvent);
          } else if (topic === 'order.cancelled') {
            await this.handleOrderCancelled(payload as OrderCancelledEvent);
          }
        } catch (error) {
          this.logger.error(`Error processing ${topic} event`, error as Error);
          // Retry logic with exponential backoff
          await this.retryWithBackoff(
            topic,
            partition,
            offset,
            key,
            payload,
            error as Error,
          );
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }

  private async handleOrderCreated(event: OrderCreatedEvent) {
    if (!event.items || event.items.length === 0) {
      this.logger.warn(`Order ${event.id} has no items, skipping stock reservation`);
      return;
    }

    this.logger.log(`Reserving stock for order ${event.id}`);
    await this.inventoryService.reserveStockBatch(
      event.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    );
    this.logger.log(`Stock reserved successfully for order ${event.id}`);
  }

  private async handleOrderCancelled(event: OrderCancelledEvent) {
    if (!event.items || event.items.length === 0) {
      this.logger.warn(`Order ${event.id} has no items, skipping stock release`);
      return;
    }

    this.logger.log(`Releasing stock for cancelled order ${event.id}`);
    await this.inventoryService.releaseStockBatch(
      event.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    );
    this.logger.log(`Stock released successfully for order ${event.id}`);
  }

  /**
   * Retry logic with exponential backoff
   * After max retries, send to Dead Letter Queue (DLQ)
   */
  private async retryWithBackoff(
    topic: string,
    partition: number,
    offset: string,
    key: string | undefined,
    payload: any,
    error: Error,
    attempt: number = 0,
  ): Promise<void> {
    if (attempt >= this.maxRetries) {
      this.logger.error(
        `Failed to process ${topic} after ${this.maxRetries} retries. Sending to DLQ.`,
        error,
      );

      // Send to Dead Letter Queue
      const failedMessage = this.dlqService.createFailedMessage(
        topic,
        partition,
        offset,
        payload,
        error,
        attempt,
        key,
      );
      await this.dlqService.sendToDLQ(failedMessage);
      return;
    }

    const delay = this.retryDelays[attempt] || this.retryDelays[this.retryDelays.length - 1];
    this.logger.warn(
      `Retrying ${topic} event (attempt ${attempt + 1}/${this.maxRetries}) after ${delay}ms`,
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      if (topic === 'order.created') {
        await this.handleOrderCreated(payload);
      } else if (topic === 'order.cancelled') {
        await this.handleOrderCancelled(payload);
      }
    } catch (retryError) {
      await this.retryWithBackoff(
        topic,
        partition,
        offset,
        key,
        payload,
        retryError as Error,
        attempt + 1,
      );
    }
  }
}


