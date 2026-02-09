import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { PromotionService } from '../modules/promotion/promotion.service';
import { KafkaService } from './kafka.service';
import { PROMOTION_VALIDATE_REQUEST_TOPIC, PROMOTION_VALIDATE_REPLY_TOPIC } from './request-reply.constants';

interface ValidateRequestPayload {
  code: string;
  userId: string;
  items: Array<{ productId: string; sellerId: string; price: number; quantity: number }>;
}

@Injectable()
export class ValidateRequestConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ValidateRequestConsumer.name);
  private consumer: Consumer | null = null;
  private readonly enabled = (process.env.KAFKA_ENABLED || 'true') !== 'false';

  constructor(
    private readonly promotionService: PromotionService,
    private readonly kafka: KafkaService,
  ) {}

  async onModuleInit() {
    if (!this.enabled) return;

    const kafka = new Kafka({
      clientId: 'promotion-service-validate-request',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'promotion-service-validate-request-group' });

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: PROMOTION_VALIDATE_REQUEST_TOPIC, fromBeginning: false });
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          const correlationId = message.headers?.correlationId?.toString();
          const replyTopic = message.headers?.replyTopic?.toString() || PROMOTION_VALIDATE_REPLY_TOPIC;
          if (!correlationId) return;
          const raw = message.value?.toString();
          if (!raw) return;

          try {
            const payload = JSON.parse(raw) as ValidateRequestPayload;
            const result = await this.promotionService.validate({
              code: payload.code,
              userId: payload.userId,
              items: payload.items.map((i) => ({
                productId: i.productId,
                sellerId: i.sellerId,
                price: i.price,
                quantity: i.quantity,
              })),
            });
            await this.kafka.emitWithHeaders(
              replyTopic,
              {
                correlationId,
                success: true,
                voucherId: result.voucherId,
                discountAmount: result.discountAmount,
                finalAmount: result.finalAmount,
              },
              { correlationId },
            );
          } catch (err) {
            const errorMessage = (err as Error).message;
            this.logger.warn(`Validate voucher failed ${correlationId}: ${errorMessage}`);
            await this.kafka.emitWithHeaders(
              replyTopic,
              { correlationId, success: false, error: errorMessage },
              { correlationId },
            );
          }
        },
      });
      this.logger.log(`ValidateRequestConsumer subscribed to ${PROMOTION_VALIDATE_REQUEST_TOPIC}`);
    } catch (err) {
      this.logger.error(`ValidateRequestConsumer init failed: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
    }
  }
}
