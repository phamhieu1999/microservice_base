import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private readonly enabled = (process.env.KAFKA_ENABLED || 'true') !== 'false';

  constructor() {
    this.kafka = new Kafka({
      clientId: 'promotion-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    if (!this.enabled) return;
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (err) {
      this.logger.warn(`Kafka connect failed: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.enabled && this.producer) {
      await this.producer.disconnect();
    }
  }

  async emitWithHeaders(
    topic: string,
    payload: unknown,
    headers: Record<string, string>,
  ): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(payload), headers }],
      });
    } catch (err) {
      this.logger.error(`Emit failed topic=${topic}: ${(err as Error).message}`);
      throw err;
    }
  }
}
