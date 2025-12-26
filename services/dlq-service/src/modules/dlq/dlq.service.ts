import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer, Producer } from 'kafkajs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FailedMessage, FailedMessageDocument } from './schemas/failed-message.schema';

@Injectable()
export class DLQService implements OnModuleInit {
  private readonly logger = new Logger(DLQService.name);
  private readonly consumer: Consumer;
  private readonly producer: Producer;

  constructor(
    @InjectModel(FailedMessage.name)
    private readonly failedMessageModel: Model<FailedMessageDocument>,
  ) {
    const kafka = new Kafka({
      clientId: 'dlq-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'dlq-service-group' });
    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.producer.connect();
    await this.consumer.subscribe({ topic: 'dlq.failed-messages', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const payload = message.value ? JSON.parse(message.value.toString()) : null;
        if (!payload) return;

        try {
          // Store failed message in database
          await this.failedMessageModel.create({
            originalTopic: payload.originalTopic,
            originalPartition: payload.originalPartition,
            originalOffset: payload.originalOffset,
            originalKey: payload.originalKey,
            originalValue: payload.originalValue,
            error: payload.error,
            timestamp: new Date(payload.timestamp),
            retryCount: payload.retryCount,
            status: 'PENDING',
          });

          this.logger.log(`Stored failed message from ${payload.originalTopic}`);
        } catch (err) {
          this.logger.error('Error storing failed message', err as Error);
        }
      },
    });
  }

  async listFailedMessages(limit = 50, skip = 0) {
    return this.failedMessageModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async getFailedMessage(id: string) {
    return this.failedMessageModel.findById(id).exec();
  }

  async retryFailedMessage(id: string) {
    const failedMessage = await this.failedMessageModel.findById(id).exec();
    if (!failedMessage) {
      throw new Error('Failed message not found');
    }

    if (failedMessage.status === 'RETRYING') {
      throw new Error('Message is already being retried');
    }

    // Exponential backoff: 1s, 5s, 15s, 60s
    const delays = [1000, 5000, 15000, 60000];
    const attempt = failedMessage.retryCount || 0;

    if (attempt >= delays.length) {
      // Move to permanent DLQ (mark as FAILED_PERMANENT)
      await this.failedMessageModel.updateOne(
        { _id: id },
        {
          status: 'FAILED_PERMANENT',
          lastError: 'Max retry attempts reached',
          updatedAt: new Date(),
        },
      );
      this.logger.warn(`Failed message ${id} reached max retry attempts`);
      return { success: false, message: 'Max retry attempts reached' };
    }

    const delay = delays[attempt];
    this.logger.log(`Scheduling retry for message ${id} in ${delay}ms (attempt ${attempt + 1})`);

    setTimeout(async () => {
      try {
        // Republish to original topic
        await this.producer.send({
          topic: failedMessage.originalTopic,
          messages: [
            {
              key: failedMessage.originalKey,
              value: JSON.stringify(failedMessage.originalValue),
              headers: {
                'x-retry-count': String((failedMessage.retryCount || 0) + 1),
                'x-original-dlq-id': id,
              },
            },
          ],
        });

        // Update status and retryCount
        await this.failedMessageModel.updateOne(
          { _id: id },
          {
            status: 'RETRYING',
            retriedAt: new Date(),
            retryCount: (failedMessage.retryCount || 0) + 1,
          },
        );

        this.logger.log(`Republished failed message ${id} to ${failedMessage.originalTopic}`);
      } catch (err) {
        this.logger.error(`Error republishing message ${id}`, err as Error);
      }
    }, delay);

    return { success: true, message: 'Retry scheduled', delayMs: delay };
  }

  async deleteFailedMessage(id: string) {
    await this.failedMessageModel.deleteOne({ _id: id });
    return { success: true };
  }
}

