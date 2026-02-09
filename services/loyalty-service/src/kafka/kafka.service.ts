import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService {
  private readonly logger = new Logger(KafkaService.name);
  private readonly producer: Producer;

  constructor() {
    const kafka = new Kafka({
      clientId: 'loyalty-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async emit(topic: string, message: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      this.logger.log(`Emitted message to topic ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to emit message to topic ${topic}`, error);
      throw error;
    }
  }
}

