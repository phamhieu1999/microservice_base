import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'payment-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      console.log('✅ Kafka producer connected');
    } catch (error) {
      console.warn(`⚠️  Failed to connect Kafka producer: ${(error as Error).message}. Service will continue but cannot emit events.`);
      // Don't throw - allow service to start even if Kafka is unavailable
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async emit(topic: string, payload: unknown) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }],
    });
  }
}


