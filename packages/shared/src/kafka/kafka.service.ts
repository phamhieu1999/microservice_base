import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { IKafkaEmitter } from '../outbox/outbox-relay.service';

export interface KafkaServiceConfig {
  clientId: string;
  brokers?: string;
  enabled?: boolean;
}

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy, IKafkaEmitter {
  private kafka: Kafka;
  private producer: Producer;
  private readonly logger = new Logger(KafkaProducerService.name);
  private readonly enabled: boolean;

  constructor(private readonly config: KafkaServiceConfig) {
    this.enabled = config.enabled !== false;
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: (config.brokers || process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('Kafka disabled, skip connect');
      return;
    }

    const maxRetries = 5;
    let retryCount = 0;
    let connected = false;

    while (retryCount < maxRetries && !connected) {
      try {
        await this.producer.connect();
        connected = true;
        this.logger.log('Kafka producer connected');
      } catch (err) {
        retryCount++;
        if (retryCount < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
          this.logger.warn(
            `Kafka connect failed (attempt ${retryCount}/${maxRetries}): ${(err as Error).message}. Retrying in ${backoffMs}ms...`,
          );
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        } else {
          this.logger.error(
            `Kafka connect failed after ${maxRetries} attempts: ${(err as Error).message}. Service will continue without Kafka.`,
          );
        }
      }
    }
  }

  async onModuleDestroy() {
    if (!this.enabled) return;
    try {
      await this.producer.disconnect();
    } catch (err) {
      this.logger.error(`Error disconnecting Kafka producer: ${(err as Error).message}`);
    }
  }

  async emit(topic: string, payload: unknown, headers?: Record<string, string>) {
    if (!this.enabled) {
      this.logger.debug(`Kafka disabled, skip emit topic=${topic}`);
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify(payload),
            headers: headers && Object.keys(headers).length > 0 ? headers : undefined,
          },
        ],
      });
    } catch (err) {
      this.logger.error(`Error emitting message to topic ${topic}: ${(err as Error).message}`);
      throw err;
    }
  }
}
