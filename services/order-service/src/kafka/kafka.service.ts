import { Injectable, OnModuleDestroy, OnModuleInit, Inject, Optional } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { TracingService } from '../common/tracing.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor(@Optional() @Inject(TracingService) private readonly tracing?: TracingService) {
    this.kafka = new Kafka({
      clientId: 'order-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async emit(topic: string, payload: unknown, traceId?: string) {
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
  }
}


