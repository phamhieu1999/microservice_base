import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { SyncShippingStatusUseCase } from '../application/order/use-cases/sync-shipping-status.usecase';

@Injectable()
export class ShippingEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ShippingEventsConsumer.name);
  private readonly consumer: Consumer;
  private readonly enabled = (process.env.KAFKA_ENABLED || 'true') !== 'false';

  constructor(private readonly syncShippingStatus: SyncShippingStatusUseCase) {
    const kafka = new Kafka({
      clientId: 'order-service-shipping-consumer',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'order-service-shipping-group' });
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('Kafka disabled, skip shipping consumer');
      return;
    }

    const maxRetries = 5;
    let retryCount = 0;
    let connected = false;

    while (retryCount < maxRetries && !connected) {
      try {
        await this.consumer.connect();
        await this.consumer.subscribe({ topic: 'shipping.order.status.updated', fromBeginning: false });

        await this.consumer.run({
          eachMessage: async ({ topic, message }) => {
            const payload = message.value ? JSON.parse(message.value.toString()) : null;
            if (!payload) return;
            try {
              await this.syncShippingStatus.execute({
                orderId: payload.orderId,
                shippingStatus: payload.newStatus,
              });
            } catch (err) {
              this.logger.error(`Error handling ${topic} event`, err as Error);
            }
          },
        });
        connected = true;
        this.logger.log('Kafka consumer connected and subscribed to shipping.order.status.updated');
      } catch (err) {
        retryCount++;
        if (retryCount < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
          this.logger.warn(
            `Shipping consumer connect failed (attempt ${retryCount}/${maxRetries}): ${(err as Error).message}. Retrying in ${backoffMs}ms...`,
          );
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        } else {
          this.logger.error(
            `Shipping consumer connect failed after ${maxRetries} attempts: ${(err as Error).message}. Service will continue without shipping consumer.`,
          );
        }
      }
    }
  }

  async onModuleDestroy() {
    if (!this.enabled) return;
    try {
      await this.consumer.disconnect();
      this.logger.log('Shipping events consumer disconnected');
    } catch (err) {
      this.logger.error(`Error disconnecting shipping consumer: ${(err as Error).message}`);
    }
  }
}
