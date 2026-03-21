import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { MarkPaidUseCase } from '../application/order/use-cases/mark-paid.usecase';
import { MarkCancelledUseCase } from '../application/order/use-cases/mark-cancelled.usecase';
import { MarkRefundedUseCase } from '../application/order/use-cases/mark-refunded.usecase';

@Injectable()
export class PaymentEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentEventsConsumer.name);
  private readonly consumer: Consumer;
  private readonly enabled = (process.env.KAFKA_ENABLED || 'true') !== 'false';

  constructor(
    private readonly markPaid: MarkPaidUseCase,
    private readonly markCancelled: MarkCancelledUseCase,
    private readonly markRefunded: MarkRefundedUseCase,
  ) {
    const kafka = new Kafka({
      clientId: 'order-service-consumer',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'order-service-group' });
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('Kafka disabled (KAFKA_ENABLED=false), skip consumer connection');
      return;
    }

    const maxRetries = 5;
    let retryCount = 0;
    let connected = false;

    while (retryCount < maxRetries && !connected) {
      try {
        await this.consumer.connect();
        await this.consumer.subscribe({ topic: 'payment.success', fromBeginning: true });
        await this.consumer.subscribe({ topic: 'payment.failed', fromBeginning: true });
        await this.consumer.subscribe({ topic: 'payment.refund.success', fromBeginning: true });

        await this.consumer.run({
          eachMessage: async ({ topic, message }) => {
            const payload = message.value ? JSON.parse(message.value.toString()) : null;
            if (!payload) return;
            try {
              if (topic === 'payment.success') {
                await this.markPaid.execute(payload.orderId);
              } else if (topic === 'payment.failed') {
                await this.markCancelled.execute(payload.orderId);
              } else if (topic === 'payment.refund.success') {
                await this.markRefunded.execute({
                  orderId: payload.orderId,
                  paymentStatus: payload.paymentStatus,
                });
              }
            } catch (err) {
              this.logger.error(`Error handling ${topic} event`, err as Error);
            }
          },
        });
        connected = true;
        this.logger.log(
          'Kafka consumer connected and subscribed to payment.success, payment.failed, payment.refund.success',
        );
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


