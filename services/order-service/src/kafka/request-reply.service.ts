import {
  INVENTORY_RESERVE_REPLY_TOPIC,
  PROMOTION_VALIDATE_REPLY_TOPIC,
  ORDER_PREPARE_REPLY_TOPIC,
  INVENTORY_RESERVE_REQUEST_TOPIC,
  PROMOTION_VALIDATE_REQUEST_TOPIC,
  ORDER_PREPARE_REQUEST_TOPIC,
} from './request-reply.constants';
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { randomUUID } from 'crypto';

/** Pattern A: reply payload chuẩn */
export interface ReserveStockRequestPayload {
  items: Array<{ productId: string; quantity: number }>;
}

export interface ReserveStockReplyPayload {
  correlationId: string;
  success: boolean;
  error?: string;
}

export interface ValidateVoucherRequestPayload {
  code: string;
  userId: string;
  items: Array<{ productId: string; sellerId: string; price: number; quantity: number }>;
}

export interface ValidateVoucherReplyPayload {
  correlationId: string;
  success: boolean;
  voucherId?: string;
  discountAmount?: number;
  finalAmount?: number;
  error?: string;
}

/** Pattern B: aggregate reply từ nhiều service */
export interface OrderPrepareReplyPayload {
  correlationId: string;
  responderId: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export const ORDER_PREPARE_EXPECTED_RESPONDERS = ['product-service', 'promotion-service'];

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface PendingAggregate {
  expected: string[];
  received: Map<string, OrderPrepareReplyPayload>;
  resolve: (value: { results: Record<string, OrderPrepareReplyPayload> }) => void;
  reject: (err: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

@Injectable()
export class KafkaRequestReplyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaRequestReplyService.name);
  private kafka: Kafka;
  private producer: Producer;
  private replyConsumer: Consumer | null = null;
  private readonly pending = new Map<string, PendingRequest>();
  private readonly pendingAggregate = new Map<string, PendingAggregate>();
  private readonly enabled = (process.env.KAFKA_ENABLED || 'true') !== 'false';
  private readonly replyConsumerGroupId = `order-service-reply-${Date.now()}`;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'order-service-request-reply',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('Kafka disabled, request-reply will no-op');
      return;
    }
    try {
      await this.producer.connect();
      this.replyConsumer = this.kafka.consumer({ groupId: this.replyConsumerGroupId });
      await this.replyConsumer.connect();
      await this.replyConsumer.subscribe({ topic: INVENTORY_RESERVE_REPLY_TOPIC, fromBeginning: false });
      await this.replyConsumer.subscribe({ topic: PROMOTION_VALIDATE_REPLY_TOPIC, fromBeginning: false });
      await this.replyConsumer.subscribe({ topic: ORDER_PREPARE_REPLY_TOPIC, fromBeginning: false });

      await this.replyConsumer.run({
        eachMessage: async ({ topic, message }) => {
          const correlationId = message.headers?.correlationId?.toString();
          if (!correlationId) return;
          const raw = message.value?.toString();
          if (!raw) return;

          try {
            if (topic === ORDER_PREPARE_REPLY_TOPIC) {
              const body = JSON.parse(raw) as OrderPrepareReplyPayload;
              const pendingAgg = this.pendingAggregate.get(correlationId);
              if (pendingAgg) {
                pendingAgg.received.set(body.responderId, body);
                const allReceived = pendingAgg.expected.every((id) => pendingAgg.received.has(id));
                if (allReceived) {
                  clearTimeout(pendingAgg.timeoutId);
                  this.pendingAggregate.delete(correlationId);
                  pendingAgg.resolve({
                    results: Object.fromEntries(pendingAgg.received),
                  });
                }
              }
              return;
            }

            const body = JSON.parse(raw) as { correlationId: string; success: boolean; [k: string]: unknown };
            const pendingReq = this.pending.get(correlationId);
            if (pendingReq) {
              clearTimeout(pendingReq.timeoutId);
              this.pending.delete(correlationId);
              pendingReq.resolve(body);
            }
          } catch (err) {
            this.logger.warn(`Failed to process reply for ${correlationId}: ${(err as Error).message}`);
          }
        },
      });
      this.logger.log(
        `Request-Reply consumer subscribed to ${INVENTORY_RESERVE_REPLY_TOPIC}, ${PROMOTION_VALIDATE_REPLY_TOPIC}, ${ORDER_PREPARE_REPLY_TOPIC}`,
      );
    } catch (err) {
      this.logger.error(`Request-Reply init failed: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    for (const [, pr] of this.pending) {
      clearTimeout(pr.timeoutId);
      pr.reject(new Error('Service shutting down'));
    }
    this.pending.clear();
    for (const [, pa] of this.pendingAggregate) {
      clearTimeout(pa.timeoutId);
      pa.reject(new Error('Service shutting down'));
    }
    this.pendingAggregate.clear();
    if (this.replyConsumer) {
      await this.replyConsumer.disconnect();
      this.replyConsumer = null;
    }
    if (this.enabled) {
      await this.producer.disconnect();
    }
  }

  private async sendRequest(
    requestTopic: string,
    payload: unknown,
    correlationId: string,
    replyTopic: string,
  ): Promise<void> {
    await this.producer.send({
      topic: requestTopic,
      messages: [
        {
          value: JSON.stringify(payload),
          headers: { correlationId, replyTopic },
        },
      ],
    });
  }

  private waitReply<T>(correlationId: string, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.pending.has(correlationId)) {
          this.pending.delete(correlationId);
          reject(new Error(`Request-Reply timeout after ${timeoutMs}ms (${correlationId})`));
        }
      }, timeoutMs);
      this.pending.set(correlationId, { resolve: resolve as (v: unknown) => void, reject, timeoutId });
    });
  }

  /** Pattern A: Reserve stock – gửi request, chờ 1 reply từ Product */
  async requestReserveStock(
    payload: ReserveStockRequestPayload,
    timeoutMs = 15_000,
  ): Promise<ReserveStockReplyPayload> {
    if (!this.enabled) {
      this.logger.warn('Kafka disabled: assuming reserve success');
      return { correlationId: '', success: true };
    }
    const correlationId = randomUUID();
    const replyPromise = this.waitReply<ReserveStockReplyPayload>(correlationId, timeoutMs);
    await this.sendRequest(
      INVENTORY_RESERVE_REQUEST_TOPIC,
      payload,
      correlationId,
      INVENTORY_RESERVE_REPLY_TOPIC,
    );
    return replyPromise;
  }

  /** Pattern A: Validate voucher – gửi request, chờ 1 reply từ Promotion */
  async requestValidateVoucher(
    payload: ValidateVoucherRequestPayload,
    timeoutMs = 10_000,
  ): Promise<ValidateVoucherReplyPayload> {
    if (!this.enabled) {
      this.logger.warn('Kafka disabled: assuming validate success');
      return { correlationId: '', success: true };
    }
    const correlationId = randomUUID();
    const replyPromise = this.waitReply<ValidateVoucherReplyPayload>(correlationId, timeoutMs);
    await this.sendRequest(
      PROMOTION_VALIDATE_REQUEST_TOPIC,
      payload,
      correlationId,
      PROMOTION_VALIDATE_REPLY_TOPIC,
    );
    return replyPromise;
  }

  /** Pattern B: Order prepare – gửi 1 request, chờ nhiều reply từ product, promotion, ... */
  async requestOrderPrepare(
    payload: {
      items: Array<{ productId: string; quantity: number; sellerId?: string; unitPrice?: number }>;
      voucherCode?: string;
      userId: string;
    },
    expectedResponders: string[] = ORDER_PREPARE_EXPECTED_RESPONDERS,
    timeoutMs = 15_000,
  ): Promise<{ results: Record<string, OrderPrepareReplyPayload> }> {
    if (!this.enabled) {
      this.logger.warn('Kafka disabled: returning empty aggregate');
      return { results: {} };
    }
    const correlationId = randomUUID();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.pendingAggregate.has(correlationId)) {
          this.pendingAggregate.delete(correlationId);
          reject(new Error(`Order prepare timeout after ${timeoutMs}ms (${correlationId})`));
        }
      }, timeoutMs);
      this.pendingAggregate.set(correlationId, {
        expected: expectedResponders,
        received: new Map(),
        resolve,
        reject,
        timeoutId,
      });
      this.producer
        .send({
          topic: ORDER_PREPARE_REQUEST_TOPIC,
          messages: [
            {
              value: JSON.stringify(payload),
              headers: { correlationId, replyTopic: ORDER_PREPARE_REPLY_TOPIC },
            },
          ],
        })
        .catch((err) => {
          if (this.pendingAggregate.has(correlationId)) {
            clearTimeout(timeoutId);
            this.pendingAggregate.delete(correlationId);
            reject(err);
          }
        });
    });
  }
}
