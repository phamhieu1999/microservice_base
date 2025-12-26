import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

export interface FailedMessage {
  topic: string;
  partition: number;
  offset: string;
  key?: string;
  value: any;
  error: string;
  timestamp: Date;
  retryCount: number;
}

@Injectable()
export class DeadLetterQueueService {
  private readonly logger = new Logger(DeadLetterQueueService.name);
  private readonly producer: Producer;
  private readonly dlqTopic = 'dlq.failed-messages';

  constructor() {
    const kafka = new Kafka({
      clientId: 'dlq-producer',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('DLQ Producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.log('DLQ Producer disconnected');
  }

  /**
   * Send failed message to Dead Letter Queue
   */
  async sendToDLQ(failedMessage: FailedMessage): Promise<void> {
    try {
      const payload = {
        originalTopic: failedMessage.topic,
        originalPartition: failedMessage.partition,
        originalOffset: failedMessage.offset,
        originalKey: failedMessage.key,
        originalValue: failedMessage.value,
        error: failedMessage.error,
        timestamp: failedMessage.timestamp.toISOString(),
        retryCount: failedMessage.retryCount,
      };

      await this.producer.send({
        topic: this.dlqTopic,
        messages: [
          {
            key: `${failedMessage.topic}-${failedMessage.partition}-${failedMessage.offset}`,
            value: JSON.stringify(payload),
            headers: {
              'original-topic': failedMessage.topic,
              'error-type': 'processing-failed',
            },
          },
        ],
      });

      this.logger.warn(
        `Message sent to DLQ: ${failedMessage.topic}:${failedMessage.partition}:${failedMessage.offset}`,
      );
    } catch (error) {
      this.logger.error('Failed to send message to DLQ', error as Error);
      // If DLQ itself fails, log to file or external system
      // In production, consider using a different mechanism (e.g., database, external queue)
    }
  }

  /**
   * Create FailedMessage from Kafka message and error
   */
  createFailedMessage(
    topic: string,
    partition: number,
    offset: string,
    value: any,
    error: Error,
    retryCount: number,
    key?: string,
  ): FailedMessage {
    return {
      topic,
      partition,
      offset,
      key,
      value,
      error: error.message,
      timestamp: new Date(),
      retryCount,
    };
  }
}

