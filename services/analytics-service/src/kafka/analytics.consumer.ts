import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { AnalyticsService } from '../modules/analytics/analytics.service';

@Injectable()
export class AnalyticsConsumer implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsConsumer.name);
  private readonly consumer: Consumer;

  constructor(private readonly analyticsService: AnalyticsService) {
    const kafka = new Kafka({
      clientId: 'analytics-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'analytics-service-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'order.created', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'payment.success', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'user.created', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'product.created', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'settlement.balance.updated', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'settlement.payout.requested', fromBeginning: false });

    await this.consumer.run({
      // Use eachBatch for better throughput and batch processing
      eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
        if (!isRunning() || isStale()) return;

        for (const message of batch.messages) {
          const payload = message.value ? JSON.parse(message.value.toString()) : null;
          if (!payload) {
            resolveOffset(message.offset);
            await heartbeat();
            continue;
          }

          try {
            await this.handleEvent(batch.topic, payload);
          } catch (err) {
            this.logger.error(`Error handling ${batch.topic}`, err as Error);
          }

          resolveOffset(message.offset);
          await heartbeat();
        }
      },
    });
  }

  private async handleEvent(topic: string, payload: any) {
    switch (topic) {
      case 'order.created':
        // Aggregate revenue metrics
        if (payload.totalAmount && payload.createdAt) {
          await this.analyticsService.aggregateRevenue(
            new Date(payload.createdAt),
            payload.totalAmount,
            1,
          );
        }

        // Aggregate product metrics for each item
        if (payload.items && Array.isArray(payload.items)) {
          for (const item of payload.items) {
            if (item.productId && item.unitPrice) {
              await this.analyticsService.aggregateProduct(
                item.productId,
                item.productName || 'Unknown',
                item.unitPrice * (item.quantity || 1),
                item.category,
                item.sellerId,
              );
            }
          }
        }
        this.logger.log(`Aggregated metrics for order: ${payload.id}`);
        break;

      case 'payment.success':
        // Additional revenue aggregation if needed
        if (payload.amount && payload.createdAt) {
          await this.analyticsService.aggregateRevenue(
            new Date(payload.createdAt),
            payload.amount,
            1,
          );
        }
        break;

      case 'user.created':
        // Aggregate user metrics
        if (payload.createdAt) {
          await this.analyticsService.aggregateUser(new Date(payload.createdAt), true);
        }
        this.logger.log(`Aggregated metrics for new user: ${payload.id}`);
        break;

      case 'product.created':
        // Initialize product metrics
        if (payload.id && payload.name) {
          await this.analyticsService.aggregateProduct(
            payload.id,
            payload.name,
            0,
            payload.category,
            payload.sellerId,
          );
        }
        break;

      case 'settlement.balance.updated':
        // payload: { sellerId, net, commission }
        if (payload.sellerId && (payload.net || payload.commission)) {
          await this.analyticsService.aggregateSellerSettlement(
            payload.sellerId,
            Number(payload.net || 0),
            Number(payload.commission || 0),
          );
        }
        break;

      case 'settlement.payout.requested':
        // payload: { sellerId, amount }
        if (payload.sellerId && payload.amount) {
          await this.analyticsService.aggregateSellerPayout(
            payload.sellerId,
            Number(payload.amount),
          );
        }
        break;
    }
  }
}

