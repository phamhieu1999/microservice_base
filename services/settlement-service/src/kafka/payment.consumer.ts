import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { SettlementService } from '../modules/settlement/settlement.service';

@Injectable()
export class PaymentSettlementConsumer implements OnModuleInit {
  private readonly logger = new Logger(PaymentSettlementConsumer.name);
  private readonly consumer: Consumer;

  constructor(private readonly settlementService: SettlementService) {
    const kafka = new Kafka({
      clientId: 'settlement-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'settlement-service-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'payment.success', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const payload = message.value ? JSON.parse(message.value.toString()) : null;
        if (!payload) return;

        try {
          await this.handleEvent(topic, payload);
        } catch (err) {
          this.logger.error(`Error handling ${topic}`, err as Error);
        }
      },
    });
  }

  private async handleEvent(topic: string, payload: any) {
    switch (topic) {
      case 'payment.success':
        // Sử dụng sellerShares nếu có (multi-seller), fallback về 1 sellerId nếu sau này thêm.
        if (Array.isArray(payload.sellerShares) && payload.sellerShares.length > 0) {
          for (const share of payload.sellerShares) {
            if (share.sellerId && share.amount) {
              await this.settlementService.applyPaymentForSeller(share.sellerId, share.amount);
              this.logger.log(
                `Applied payment.success amount=${share.amount} for seller=${share.sellerId}`,
              );
            }
          }
        } else if (payload.sellerId && payload.amount) {
          // Backward-compatible path nếu event vẫn có 1 sellerId
          await this.settlementService.applyPaymentForSeller(payload.sellerId, payload.amount);
          this.logger.log(
            `Applied payment.success amount=${payload.amount} for seller=${payload.sellerId}`,
          );
        }
        break;
    }
  }
}
