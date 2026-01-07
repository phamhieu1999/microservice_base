import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private readonly logger = new Logger(KafkaService.name);
  /**
   * Cho phép tắt Kafka trong môi trường dev/local
   * bằng cách set KAFKA_ENABLED=false.
   */
  private readonly enabled = (process.env.KAFKA_ENABLED || 'true') !== 'false';

  constructor() {
    this.kafka = new Kafka({
      clientId: 'auth-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('Kafka disabled (KAFKA_ENABLED=false), skip connect');
      return;
    }

    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (err) {
      this.logger.error(
        `Kafka connect failed: ${(err as Error).message}. Service will continue without Kafka.`,
      );
    }
  }

  async onModuleDestroy() {
    if (!this.enabled) return;
    await this.producer.disconnect();
  }

  async emit(topic: string, payload: unknown) {
    if (!this.enabled) {
      this.logger.debug(
        `Kafka disabled, skip emit topic=${topic} payload=${JSON.stringify(
          payload,
        )}`,
      );
      return;
    }

    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }],
    });
  }
}


