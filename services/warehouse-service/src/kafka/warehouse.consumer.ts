import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { WarehouseService } from '../modules/warehouse/warehouse.service';

@Injectable()
export class WarehouseConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WarehouseConsumer.name);
  private consumer;

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly warehouseService: WarehouseService,
  ) {}

  async onModuleInit() {
    try {
      this.consumer = this.kafkaService.getConsumer('warehouse-service-group');
      
      // Test connection với retry logic
      const maxRetries = 5;
      let retryCount = 0;
      let connected = false;

      while (retryCount < maxRetries && !connected) {
        try {
          await this.consumer.connect();
          connected = true;
          this.logger.log('Kafka consumer connected');
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries) {
            const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
            this.logger.warn(
              `Failed to connect Kafka consumer (attempt ${retryCount}/${maxRetries}). Retrying in ${backoffMs}ms...`,
              error instanceof Error ? error.message : 'Unknown error'
            );
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          } else {
            this.logger.error(
              `Failed to connect Kafka consumer after ${maxRetries} attempts. Consumer will not start.`,
              error instanceof Error ? error.message : 'Unknown error'
            );
            // Không throw error để service vẫn có thể khởi động
            return;
          }
        }
      }

      if (!connected) {
        return;
      }

      // Subscribe to topics
      await this.consumer.subscribe({ topic: 'order.created', fromBeginning: false });
      await this.consumer.subscribe({ topic: 'payment.success', fromBeginning: false });
      await this.consumer.subscribe({ topic: 'settlement.balance.updated', fromBeginning: false });
      await this.consumer.subscribe({ topic: 'loyalty.points.earned', fromBeginning: false });
      await this.consumer.subscribe({ topic: 'user.created', fromBeginning: false });
      await this.consumer.subscribe({ topic: 'product.created', fromBeginning: false });

      // Start consuming với batch processing để tối ưu throughput
      await this.consumer.run({
      // Batch processing - xử lý nhiều messages cùng lúc
      eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary }) => {
        const { topic, partition, messages } = batch;
        const maxRetries = 3;
        let retryCount = 0;
        let lastError: Error | null = null;

        while (retryCount < maxRetries) {
          try {
            // Parse tất cả messages trong batch
            const events = messages.map(msg => ({
              offset: msg.offset,
              value: JSON.parse(msg.value?.toString() || '{}'),
            }));

            // Group events by topic để batch process
            const eventsByTopic = new Map<string, any[]>();
            events.forEach(event => {
              if (!eventsByTopic.has(topic)) {
                eventsByTopic.set(topic, []);
              }
              eventsByTopic.get(topic)!.push(event.value);
            });

            // Process batch theo topic
            for (const [eventTopic, eventValues] of eventsByTopic) {
              switch (eventTopic) {
                case 'order.created':
                  await this.handleOrderCreatedBatch(eventValues);
                  break;
                case 'payment.success':
                  await this.handlePaymentSuccessBatch(eventValues);
                  break;
                case 'settlement.balance.updated':
                  await this.handleSettlementUpdatedBatch(eventValues);
                  break;
                case 'loyalty.points.earned':
                  await this.handleLoyaltyPointsEarnedBatch(eventValues);
                  break;
                case 'user.created':
                  await this.handleUserCreatedBatch(eventValues);
                  break;
                case 'product.created':
                  await this.handleProductCreatedBatch(eventValues);
                  break;
                default:
                  this.logger.warn(`Unknown topic: ${eventTopic}`);
              }
            }

            // Commit tất cả offsets trong batch
            for (const message of messages) {
              resolveOffset(message.offset);
            }
            await commitOffsetsIfNecessary();
            await heartbeat();

            // Success - break retry loop
            if (retryCount > 0) {
              this.logger.log(`Successfully processed batch from ${topic} (${messages.length} messages) after ${retryCount} retries`);
            } else {
              this.logger.debug(`Successfully processed batch from ${topic} (${messages.length} messages)`);
            }
            break;
          } catch (error) {
            lastError = error as Error;
            retryCount++;
            
            if (retryCount < maxRetries) {
              const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
              this.logger.warn(
                `Error processing batch from ${topic} (${messages.length} messages, attempt ${retryCount}/${maxRetries}). Retrying in ${backoffMs}ms...`,
                error
              );
              await new Promise(resolve => setTimeout(resolve, backoffMs));
            } else {
              this.logger.error(
                `Failed to process batch from ${topic} (${messages.length} messages) after ${maxRetries} retries. Messages will be skipped.`,
                lastError
              );
              // TODO: Send to Dead Letter Queue (DLQ) for manual review
              // Commit anyway để tránh infinite loop
              for (const message of messages) {
                resolveOffset(message.offset);
              }
              await commitOffsetsIfNecessary();
            }
          }
        }
      },
      eachBatchAutoResolve: false, // Manual offset management
    });

      this.logger.log('Warehouse consumer started');
    } catch (error) {
      this.logger.error(
        'Error initializing warehouse consumer',
        error instanceof Error ? error.message : 'Unknown error'
      );
      // Không throw error để service vẫn có thể khởi động
    }
  }

  async onModuleDestroy() {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.logger.log('Warehouse consumer disconnected');
    }
  }

  private async handleOrderCreated(event: any) {
    const orderDate = event.createdAt ? new Date(event.createdAt) : new Date();
    
    // Insert order fact for each item
    if (event.items && Array.isArray(event.items)) {
      for (const item of event.items) {
        await this.warehouseService.insertOrderFact({
          orderId: event.orderId || event.id,
          userId: event.userId,
          sellerId: item.sellerId || event.sellerId,
          productId: item.productId,
          orderGroupId: event.orderGroupId,
          voucherId: event.voucherId,
          totalAmount: item.price * item.quantity,
          discountAmount: event.discountAmount,
          shippingFee: event.shippingFee,
          status: event.status || 'PENDING',
          orderDate,
        });
      }
    } else {
      // Single order fact if no items
      await this.warehouseService.insertOrderFact({
        orderId: event.orderId || event.id,
        userId: event.userId,
        sellerId: event.sellerId,
        orderGroupId: event.orderGroupId,
        voucherId: event.voucherId,
        totalAmount: event.totalAmount || 0,
        discountAmount: event.discountAmount,
        shippingFee: event.shippingFee,
        status: event.status || 'PENDING',
        orderDate,
      });
    }
  }

  private async handlePaymentSuccess(event: any) {
    const paymentDate = event.createdAt ? new Date(event.createdAt) : new Date();
    
    await this.warehouseService.insertPaymentFact({
      paymentId: event.paymentId || event.id,
      orderId: event.orderId,
      userId: event.userId,
      sellerId: event.sellerId, // Add sellerId from event
      amount: event.amount,
      fee: event.fee || 0,
      paymentMethod: event.method || event.paymentMethod || 'UNKNOWN',
      provider: event.provider || 'UNKNOWN',
      status: 'SUCCESS',
      paymentDate,
    });
  }

  private async handleSettlementUpdated(event: any) {
    const settlementDate = event.createdAt ? new Date(event.createdAt) : new Date();
    
    await this.warehouseService.insertSettlementFact({
      settlementId: event.settlementId || `settlement_${Date.now()}`,
      sellerId: event.sellerId,
      orderId: event.orderId,
      netRevenue: event.netRevenue || 0,
      commission: event.commission || 0,
      payoutAmount: event.payoutAmount || 0,
      payoutStatus: event.payoutStatus || 'PENDING',
      settlementDate,
    });
  }

  private async handleLoyaltyPointsEarned(event: any) {
    const transactionDate = event.createdAt ? new Date(event.createdAt) : new Date();
    
    await this.warehouseService.insertLoyaltyFact({
      transactionId: event.transactionId || event.id || `loyalty_${Date.now()}`,
      userId: event.userId,
      orderId: event.orderId,
      pointsEarned: event.pointsEarned || event.points || 0,
      balanceAfter: event.balanceAfter || event.balance || 0,
      eventType: 'EARN',
      transactionDate,
    });
  }

  private async handleUserCreated(event: any) {
    const createdAt = event.createdAt ? new Date(event.createdAt) : new Date();
    
    await this.warehouseService.upsertUserDimension({
      userId: event.userId || event.id,
      email: event.email || '',
      role: event.role || 'USER',
      createdAt,
    });
  }

  private async handleProductCreated(event: any) {
    const createdAt = event.createdAt ? new Date(event.createdAt) : new Date();
    
    await this.warehouseService.upsertProductDimension({
      productId: event.productId || event.id,
      name: event.name || '',
      category: event.category,
      brand: event.brand,
      sellerId: event.sellerId,
      price: event.price,
      createdAt,
    });
  }

  // Batch handlers để tối ưu performance
  private async handleOrderCreatedBatch(events: any[]) {
    const orderFacts = [];
    const userIds = new Set<string>();
    const sellerIds = new Set<string>();
    const productIds = new Set<string>();
    
    for (const event of events) {
      const orderDate = event.createdAt ? new Date(event.createdAt) : new Date();
      
      if (event.items && Array.isArray(event.items)) {
        for (const item of event.items) {
          const sid = item.sellerId || event.sellerId;
          orderFacts.push({
            orderId: event.orderId || event.id,
            userId: event.userId,
            sellerId: sid,
            productId: item.productId,
            orderGroupId: event.orderGroupId,
            voucherId: event.voucherId,
            totalAmount: item.price * item.quantity,
            discountAmount: event.discountAmount,
            shippingFee: event.shippingFee,
            status: event.status || 'PENDING',
            orderDate,
          });
          if (sid) sellerIds.add(sid);
          if (item.productId) productIds.add(item.productId);
        }
      } else {
        orderFacts.push({
          orderId: event.orderId || event.id,
          userId: event.userId,
          sellerId: event.sellerId,
          orderGroupId: event.orderGroupId,
          voucherId: event.voucherId,
          totalAmount: event.totalAmount || 0,
          discountAmount: event.discountAmount,
          shippingFee: event.shippingFee,
          status: event.status || 'PENDING',
          orderDate,
        });
        if (event.sellerId) sellerIds.add(event.sellerId);
      }

      if (event.userId) {
        userIds.add(event.userId);
      }
    }

    // Batch insert
    if (orderFacts.length > 0) {
      await this.warehouseService.batchInsertOrderFacts(orderFacts);

      // Rebuild dim_user_activity for affected users
      await Promise.allSettled(
        Array.from(userIds).map(userId => this.warehouseService.rebuildUserActivity(userId)),
      );
      // Rebuild dim_seller_activity for affected sellers
      await Promise.allSettled(
        Array.from(sellerIds).map(sid => this.warehouseService.rebuildSellerActivity(sid)),
      );
      // Rebuild dim_product_activity for affected products
      await Promise.allSettled(
        Array.from(productIds).map(pid => this.warehouseService.rebuildProductActivity(pid)),
      );
    }
  }

  private async handlePaymentSuccessBatch(events: any[]) {
    const userIds = new Set<string>();
    const sellerIds = new Set<string>();
    const paymentFacts = events.map(event => {
      const paymentDate = event.createdAt ? new Date(event.createdAt) : new Date();
      if (event.userId) userIds.add(event.userId);
      if (event.sellerId) sellerIds.add(event.sellerId);
      return {
        paymentId: event.paymentId || event.id,
        orderId: event.orderId,
        userId: event.userId,
        sellerId: event.sellerId,
        amount: event.amount,
        fee: event.fee || 0,
        paymentMethod: event.method || event.paymentMethod || 'UNKNOWN',
        provider: event.provider || 'UNKNOWN',
        status: 'SUCCESS',
        paymentDate,
      };
    });

    await this.warehouseService.batchInsertPaymentFacts(paymentFacts);

    // Rebuild dim_user_activity for affected users
    if (userIds.size > 0) {
      await Promise.allSettled(
        Array.from(userIds).map(userId => this.warehouseService.rebuildUserActivity(userId)),
      );
    }
    // Rebuild dim_seller_activity for affected sellers
    if (sellerIds.size > 0) {
      await Promise.allSettled(
        Array.from(sellerIds).map(sid => this.warehouseService.rebuildSellerActivity(sid)),
      );
    }
  }

  private async handleSettlementUpdatedBatch(events: any[]) {
    const sellerIds = new Set<string>();
    const settlementFacts = events.map(event => {
      const settlementDate = event.createdAt ? new Date(event.createdAt) : new Date();
      if (event.sellerId) sellerIds.add(event.sellerId);
      return {
        settlementId: event.settlementId || `settlement_${Date.now()}_${Math.random()}`,
        sellerId: event.sellerId,
        orderId: event.orderId,
        netRevenue: event.netRevenue || 0,
        commission: event.commission || 0,
        payoutAmount: event.payoutAmount || 0,
        payoutStatus: event.payoutStatus || 'PENDING',
        settlementDate,
      };
    });

    await this.warehouseService.batchInsertSettlementFacts(settlementFacts);

    // Rebuild dim_seller_activity for affected sellers
    if (sellerIds.size > 0) {
      await Promise.allSettled(
        Array.from(sellerIds).map(sid => this.warehouseService.rebuildSellerActivity(sid)),
      );
    }
  }

  private async handleLoyaltyPointsEarnedBatch(events: any[]) {
    const userIds = new Set<string>();
    const loyaltyFacts = events.map(event => {
      const transactionDate = event.createdAt ? new Date(event.createdAt) : new Date();
      if (event.userId) {
        userIds.add(event.userId);
      }
      return {
        transactionId: event.transactionId || event.id || `loyalty_${Date.now()}_${Math.random()}`,
        userId: event.userId,
        orderId: event.orderId,
        pointsEarned: event.pointsEarned || event.points || 0,
        balanceAfter: event.balanceAfter || event.balance || 0,
        eventType: 'EARN',
        transactionDate,
      };
    });

    await this.warehouseService.batchInsertLoyaltyFacts(loyaltyFacts);

    // Rebuild dim_user_activity for affected users
    if (userIds.size > 0) {
      await Promise.allSettled(
        Array.from(userIds).map(userId => this.warehouseService.rebuildUserActivity(userId)),
      );
    }
  }

  private async handleUserCreatedBatch(events: any[]) {
    const userDimensions = events.map(event => {
      const createdAt = event.createdAt ? new Date(event.createdAt) : new Date();
      return {
        userId: event.userId || event.id,
        email: event.email || '',
        role: event.role || 'USER',
        createdAt,
      };
    });

    await this.warehouseService.batchUpsertUserDimensions(userDimensions);

    // Rebuild dim_user_activity for affected users
    const userIds = Array.from(
      new Set(userDimensions.map(dim => dim.userId).filter((id): id is string => !!id)),
    );
    if (userIds.length > 0) {
      await Promise.allSettled(
        userIds.map(userId => this.warehouseService.rebuildUserActivity(userId)),
      );
    }
  }

  private async handleProductCreatedBatch(events: any[]) {
    const productDimensions = events.map(event => {
      const createdAt = event.createdAt ? new Date(event.createdAt) : new Date();
      return {
        productId: event.productId || event.id,
        name: event.name || '',
        category: event.category,
        brand: event.brand,
        sellerId: event.sellerId,
        price: event.price,
        createdAt,
      };
    });

    await this.warehouseService.batchUpsertProductDimensions(productDimensions);

    // Rebuild dim_product_activity for affected products
    const productIds = Array.from(
      new Set(productDimensions.map(dim => dim.productId).filter((id): id is string => !!id)),
    );
    if (productIds.length > 0) {
      await Promise.allSettled(
        productIds.map(pid => this.warehouseService.rebuildProductActivity(pid)),
      );
    }
  }
}

