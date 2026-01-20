import { Injectable, OnModuleDestroy, OnModuleInit, Inject, Optional, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { TracingService } from '../common/tracing.service';

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

  constructor(@Optional() @Inject(TracingService) private readonly tracing?: TracingService) {
    this.kafka = new Kafka({
      clientId: 'order-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('Kafka disabled (KAFKA_ENABLED=false), skip connect');
      return;
    }

    // Retry logic với exponential backoff
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
          // Không throw error để service vẫn có thể khởi động
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

  async emit(topic: string, payload: unknown, traceId?: string) {
    if (!this.enabled) {
      this.logger.debug(
        `Kafka disabled, skip emit topic=${topic} payload=${JSON.stringify(payload)}`,
      );
      return;
    }

    try {
      // Propagate trace ID trong Kafka message headers
      const headers: Record<string, string> = {};
      if (traceId) {
        headers['x-trace-id'] = traceId;
      } else if (this.tracing) {
        // Try to get current trace ID from active span
        const activeTraceId = this.tracing.getActiveTraceId();
        if (activeTraceId) {
          headers['x-trace-id'] = activeTraceId;
        }
      }

      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify(payload),
            headers: Object.keys(headers).length > 0 ? headers : undefined,
          },
        ],
      });
    } catch (err) {
      this.logger.error(`Error emitting message to topic ${topic}: ${(err as Error).message}`);
      throw err;
    }
  }
}


