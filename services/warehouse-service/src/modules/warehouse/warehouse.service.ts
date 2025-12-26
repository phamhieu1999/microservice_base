import { Injectable, Logger } from '@nestjs/common';
import { ClickHouseService } from '../../database/clickhouse.service';

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);
  
  // Batch buffers để tối ưu insert performance
  private orderFactBuffer: any[] = [];
  private paymentFactBuffer: any[] = [];
  private readonly BATCH_SIZE = 100; // Flush khi đủ 100 records
  private readonly BATCH_TIMEOUT = 5000; // Flush sau 5 giây nếu chưa đủ batch
  private flushTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(private readonly clickhouse: ClickHouseService) {
    // Auto-flush buffers định kỳ
    this.startAutoFlush();
  }

  /**
   * Auto-flush buffers sau một khoảng thời gian
   */
  private startAutoFlush() {
    setInterval(() => {
      this.flushAllBuffers();
    }, this.BATCH_TIMEOUT);
  }

  /**
   * Flush tất cả buffers
   */
  private async flushAllBuffers() {
    const promises: Promise<void>[] = [];
    
    if (this.orderFactBuffer.length > 0) {
      promises.push(this.flushOrderFacts());
    }
    if (this.paymentFactBuffer.length > 0) {
      promises.push(this.flushPaymentFacts());
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  /**
   * Insert order fact (với batch buffering)
   */
  async insertOrderFact(data: {
    orderId: string;
    userId: string;
    sellerId?: string;
    productId?: string;
    orderGroupId?: string;
    voucherId?: string;
    totalAmount: number;
    discountAmount?: number;
    shippingFee?: number;
    status: string;
    orderDate: Date;
  }) {
    // Add to buffer
    this.orderFactBuffer.push({
      order_id: data.orderId,
      user_id: data.userId,
      seller_id: data.sellerId || '',
      product_id: data.productId || '',
      order_group_id: data.orderGroupId || '',
      voucher_id: data.voucherId || '',
      total_amount: data.totalAmount,
      discount_amount: data.discountAmount || 0,
      shipping_fee: data.shippingFee || 0,
      status: data.status,
      order_date: data.orderDate,
      order_datetime: data.orderDate,
    });

    // Flush nếu đủ batch size
    if (this.orderFactBuffer.length >= this.BATCH_SIZE) {
      await this.flushOrderFacts();
    } else {
      // Set timeout để flush sau một khoảng thời gian
      this.scheduleFlush('order', () => this.flushOrderFacts());
    }
  }

  /**
   * Flush order facts buffer
   */
  private async flushOrderFacts() {
    if (this.orderFactBuffer.length === 0) return;

    const batch = [...this.orderFactBuffer];
    this.orderFactBuffer = [];
    this.clearFlushTimer('order');

    try {
      const client = this.clickhouse.getClient();
      
      await client.insert({
        table: 'fact_order',
        values: batch,
        format: 'JSONEachRow',
      });

      this.logger.debug(`Batch inserted ${batch.length} order facts`);
    } catch (error) {
      this.logger.error(`Failed to batch insert order facts`, error);
      // Re-add to buffer để retry sau
      this.orderFactBuffer.unshift(...batch);
      throw error;
    }
  }

  /**
   * Schedule flush với timeout
   */
  private scheduleFlush(key: string, flushFn: () => Promise<void>) {
    this.clearFlushTimer(key);
    
    this.flushTimers.set(key, setTimeout(async () => {
      try {
        await flushFn();
      } catch (error) {
        this.logger.error(`Error in scheduled flush for ${key}`, error);
      }
    }, this.BATCH_TIMEOUT));
  }

  /**
   * Clear flush timer
   */
  private clearFlushTimer(key: string) {
    const timer = this.flushTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.flushTimers.delete(key);
    }
  }

  /**
   * Insert payment fact (với batch buffering)
   */
  async insertPaymentFact(data: {
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    fee?: number;
    paymentMethod: string;
    provider: string;
    status: string;
    paymentDate: Date;
  }) {
    // Add to buffer
    this.paymentFactBuffer.push({
      payment_id: data.paymentId,
      order_id: data.orderId,
      user_id: data.userId,
      amount: data.amount,
      fee: data.fee || 0,
      payment_method: data.paymentMethod,
      provider: data.provider,
      status: data.status,
      payment_date: data.paymentDate,
      payment_datetime: data.paymentDate,
    });

    // Flush nếu đủ batch size
    if (this.paymentFactBuffer.length >= this.BATCH_SIZE) {
      await this.flushPaymentFacts();
    } else {
      // Set timeout để flush sau một khoảng thời gian
      this.scheduleFlush('payment', () => this.flushPaymentFacts());
    }
  }

  /**
   * Flush payment facts buffer
   */
  private async flushPaymentFacts() {
    if (this.paymentFactBuffer.length === 0) return;

    const batch = [...this.paymentFactBuffer];
    this.paymentFactBuffer = [];
    this.clearFlushTimer('payment');

    try {
      const client = this.clickhouse.getClient();
      
      await client.insert({
        table: 'fact_payment',
        values: batch,
        format: 'JSONEachRow',
      });

      this.logger.debug(`Batch inserted ${batch.length} payment facts`);
    } catch (error) {
      this.logger.error(`Failed to batch insert payment facts`, error);
      // Re-add to buffer để retry sau
      this.paymentFactBuffer.unshift(...batch);
      throw error;
    }
  }

  /**
   * Batch insert order facts (từ Kafka batch processing)
   */
  async batchInsertOrderFacts(dataArray: Array<{
    orderId: string;
    userId: string;
    sellerId?: string;
    productId?: string;
    orderGroupId?: string;
    voucherId?: string;
    totalAmount: number;
    discountAmount?: number;
    shippingFee?: number;
    status: string;
    orderDate: Date;
  }>) {
    if (dataArray.length === 0) return;

    const values = dataArray.map(data => ({
      order_id: data.orderId,
      user_id: data.userId,
      seller_id: data.sellerId || '',
      product_id: data.productId || '',
      order_group_id: data.orderGroupId || '',
      voucher_id: data.voucherId || '',
      total_amount: data.totalAmount,
      discount_amount: data.discountAmount || 0,
      shipping_fee: data.shippingFee || 0,
      status: data.status,
      order_date: data.orderDate,
      order_datetime: data.orderDate,
    }));

    try {
      const client = this.clickhouse.getClient();
      await client.insert({
        table: 'fact_order',
        values,
        format: 'JSONEachRow',
      });
      this.logger.debug(`Batch inserted ${values.length} order facts`);
    } catch (error) {
      this.logger.error(`Failed to batch insert order facts`, error);
      throw error;
    }
  }

  /**
   * Batch insert payment facts (từ Kafka batch processing)
   */
  async batchInsertPaymentFacts(dataArray: Array<{
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    fee?: number;
    paymentMethod: string;
    provider: string;
    status: string;
    paymentDate: Date;
  }>) {
    if (dataArray.length === 0) return;

    const values = dataArray.map(data => ({
      payment_id: data.paymentId,
      order_id: data.orderId,
      user_id: data.userId,
      amount: data.amount,
      fee: data.fee || 0,
      payment_method: data.paymentMethod,
      provider: data.provider,
      status: data.status,
      payment_date: data.paymentDate,
      payment_datetime: data.paymentDate,
    }));

    try {
      const client = this.clickhouse.getClient();
      await client.insert({
        table: 'fact_payment',
        values,
        format: 'JSONEachRow',
      });
      this.logger.debug(`Batch inserted ${values.length} payment facts`);
    } catch (error) {
      this.logger.error(`Failed to batch insert payment facts`, error);
      throw error;
    }
  }

  /**
   * Batch insert settlement facts
   */
  async batchInsertSettlementFacts(dataArray: Array<{
    settlementId: string;
    sellerId: string;
    orderId: string;
    netRevenue: number;
    commission: number;
    payoutAmount: number;
    payoutStatus: string;
    settlementDate: Date;
  }>) {
    if (dataArray.length === 0) return;

    const values = dataArray.map(data => ({
      settlement_id: data.settlementId,
      seller_id: data.sellerId,
      order_id: data.orderId,
      net_revenue: data.netRevenue,
      commission: data.commission,
      payout_amount: data.payoutAmount,
      payout_status: data.payoutStatus,
      settlement_date: data.settlementDate,
      settlement_datetime: data.settlementDate,
    }));

    try {
      const client = this.clickhouse.getClient();
      await client.insert({
        table: 'fact_settlement',
        values,
        format: 'JSONEachRow',
      });
      this.logger.debug(`Batch inserted ${values.length} settlement facts`);
    } catch (error) {
      this.logger.error(`Failed to batch insert settlement facts`, error);
      throw error;
    }
  }

  /**
   * Batch insert loyalty facts
   */
  async batchInsertLoyaltyFacts(dataArray: Array<{
    transactionId: string;
    userId: string;
    orderId?: string;
    pointsEarned?: number;
    pointsRedeemed?: number;
    balanceAfter: number;
    eventType: string;
    transactionDate: Date;
  }>) {
    if (dataArray.length === 0) return;

    const values = dataArray.map(data => ({
      transaction_id: data.transactionId,
      user_id: data.userId,
      order_id: data.orderId || '',
      points_earned: data.pointsEarned || 0,
      points_redeemed: data.pointsRedeemed || 0,
      balance_after: data.balanceAfter,
      event_type: data.eventType,
      transaction_date: data.transactionDate,
      transaction_datetime: data.transactionDate,
    }));

    try {
      const client = this.clickhouse.getClient();
      await client.insert({
        table: 'fact_loyalty',
        values,
        format: 'JSONEachRow',
      });
      this.logger.debug(`Batch inserted ${values.length} loyalty facts`);
    } catch (error) {
      this.logger.error(`Failed to batch insert loyalty facts`, error);
      throw error;
    }
  }

  /**
   * Batch upsert user dimensions
   */
  async batchUpsertUserDimensions(dataArray: Array<{
    userId: string;
    email: string;
    role: string;
    createdAt: Date;
  }>) {
    if (dataArray.length === 0) return;

    const values = dataArray.map(data => ({
      user_id: data.userId,
      email: data.email,
      role: data.role,
      created_at: data.createdAt,
      updated_at: new Date(),
    }));

    try {
      const client = this.clickhouse.getClient();
      await client.insert({
        table: 'dim_user',
        values,
        format: 'JSONEachRow',
      });
      this.logger.debug(`Batch upserted ${values.length} user dimensions`);
    } catch (error) {
      this.logger.error(`Failed to batch upsert user dimensions`, error);
      throw error;
    }
  }

  /**
   * Batch upsert product dimensions
   */
  async batchUpsertProductDimensions(dataArray: Array<{
    productId: string;
    name: string;
    category?: string;
    brand?: string;
    sellerId?: string;
    price?: number;
    createdAt: Date;
  }>) {
    if (dataArray.length === 0) return;

    const values = dataArray.map(data => ({
      product_id: data.productId,
      name: data.name,
      category: data.category || '',
      brand: data.brand || '',
      seller_id: data.sellerId || '',
      price: data.price || 0,
      created_at: data.createdAt,
      updated_at: new Date(),
    }));

    try {
      const client = this.clickhouse.getClient();
      await client.insert({
        table: 'dim_product',
        values,
        format: 'JSONEachRow',
      });
      this.logger.debug(`Batch upserted ${values.length} product dimensions`);
    } catch (error) {
      this.logger.error(`Failed to batch upsert product dimensions`, error);
      throw error;
    }
  }

  /**
   * Insert settlement fact
   */
  async insertSettlementFact(data: {
    settlementId: string;
    sellerId: string;
    orderId: string;
    netRevenue: number;
    commission: number;
    payoutAmount: number;
    payoutStatus: string;
    settlementDate: Date;
  }) {
    try {
      const client = this.clickhouse.getClient();
      
      await client.insert({
        table: 'fact_settlement',
        values: [
          {
            settlement_id: data.settlementId,
            seller_id: data.sellerId,
            order_id: data.orderId,
            net_revenue: data.netRevenue,
            commission: data.commission,
            payout_amount: data.payoutAmount,
            payout_status: data.payoutStatus,
            settlement_date: data.settlementDate,
            settlement_datetime: data.settlementDate,
          },
        ],
        format: 'JSONEachRow',
      });

      this.logger.debug(`Inserted settlement fact: ${data.settlementId}`);
    } catch (error) {
      this.logger.error(`Failed to insert settlement fact: ${data.settlementId}`, error);
      throw error;
    }
  }

  /**
   * Insert loyalty fact
   */
  async insertLoyaltyFact(data: {
    transactionId: string;
    userId: string;
    orderId?: string;
    pointsEarned?: number;
    pointsRedeemed?: number;
    balanceAfter: number;
    eventType: string;
    transactionDate: Date;
  }) {
    try {
      const client = this.clickhouse.getClient();
      
      await client.insert({
        table: 'fact_loyalty',
        values: [
          {
            transaction_id: data.transactionId,
            user_id: data.userId,
            order_id: data.orderId || '',
            points_earned: data.pointsEarned || 0,
            points_redeemed: data.pointsRedeemed || 0,
            balance_after: data.balanceAfter,
            event_type: data.eventType,
            transaction_date: data.transactionDate,
            transaction_datetime: data.transactionDate,
          },
        ],
        format: 'JSONEachRow',
      });

      this.logger.debug(`Inserted loyalty fact: ${data.transactionId}`);
    } catch (error) {
      this.logger.error(`Failed to insert loyalty fact: ${data.transactionId}`, error);
      throw error;
    }
  }

  /**
   * Upsert user dimension
   */
  async upsertUserDimension(data: {
    userId: string;
    email: string;
    role: string;
    createdAt: Date;
  }) {
    try {
      const client = this.clickhouse.getClient();
      
      await client.insert({
        table: 'dim_user',
        values: [
          {
            user_id: data.userId,
            email: data.email,
            role: data.role,
            created_at: data.createdAt,
            updated_at: new Date(),
          },
        ],
        format: 'JSONEachRow',
      });

      this.logger.debug(`Upserted user dimension: ${data.userId}`);
    } catch (error) {
      this.logger.error(`Failed to upsert user dimension: ${data.userId}`, error);
      throw error;
    }
  }

  /**
   * Upsert product dimension
   */
  async upsertProductDimension(data: {
    productId: string;
    name: string;
    category?: string;
    brand?: string;
    sellerId?: string;
    price?: number;
    createdAt: Date;
  }) {
    try {
      const client = this.clickhouse.getClient();
      
      await client.insert({
        table: 'dim_product',
        values: [
          {
            product_id: data.productId,
            name: data.name,
            category: data.category || '',
            brand: data.brand || '',
            seller_id: data.sellerId || '',
            price: data.price || 0,
            created_at: data.createdAt,
            updated_at: new Date(),
          },
        ],
        format: 'JSONEachRow',
      });

      this.logger.debug(`Upserted product dimension: ${data.productId}`);
    } catch (error) {
      this.logger.error(`Failed to upsert product dimension: ${data.productId}`, error);
      throw error;
    }
  }

  /**
   * Query: Get daily revenue (tối ưu với materialized view khi có thể)
   */
  async getDailyRevenue(startDate: Date, endDate: Date, sellerId?: string) {
    const client = this.clickhouse.getClient();
    
    // Sử dụng materialized view nếu không có sellerId filter (nhanh hơn nhiều)
    const useMaterializedView = !sellerId;
    
    let query = '';
    if (useMaterializedView) {
      // Query từ materialized view - nhanh hơn nhiều
      query = `
        SELECT
          revenue_date,
          sum(total_revenue) AS total_revenue,
          sum(order_count) AS order_count,
          avg(total_revenue) AS avg_order_value
        FROM mv_daily_revenue
        WHERE revenue_date >= {startDate:Date}
          AND revenue_date <= {endDate:Date}
        GROUP BY revenue_date
        ORDER BY revenue_date
      `;
    } else {
      // Query từ fact table với seller filter
      query = `
        SELECT
          toDate(payment_datetime) AS revenue_date,
          seller_id,
          sum(amount) AS total_revenue,
          count() AS order_count,
          avg(amount) AS avg_order_value
        FROM fact_payment
        WHERE status = 'SUCCESS'
          AND payment_date >= {startDate:Date}
          AND payment_date <= {endDate:Date}
          AND seller_id = {sellerId:String}
        GROUP BY revenue_date, seller_id
        ORDER BY revenue_date
      `;
    }

    const params: any = {
      startDate,
      endDate,
    };
    if (sellerId) {
      params.sellerId = sellerId;
    }

    const result = await client.query({
      query,
      query_params: params,
      format: 'JSONEachRow',
      request_timeout: 30000, // 30 seconds timeout
    });

    return await result.json();
  }

  /**
   * Query: Get top sellers (tối ưu với date filter để partition pruning)
   */
  async getTopSellers(limit: number = 10, startDate?: Date, endDate?: Date) {
    const client = this.clickhouse.getClient();
    
    // Luôn yêu cầu date filter để tối ưu partition pruning
    if (!startDate || !endDate) {
      // Default to last 30 days nếu không có date filter
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }
    
    const query = `
      SELECT
        seller_id,
        sum(amount) AS total_revenue,
        count() AS order_count,
        avg(amount) AS avg_order_value
      FROM fact_payment
      WHERE status = 'SUCCESS'
        AND payment_date >= {startDate:Date}
        AND payment_date <= {endDate:Date}
      GROUP BY seller_id
      ORDER BY total_revenue DESC
      LIMIT {limit:UInt32}
    `;

    const params = {
      limit,
      startDate,
      endDate,
    };

    const result = await client.query({
      query,
      query_params: params,
      format: 'JSONEachRow',
      request_timeout: 30000, // 30 seconds timeout
    });

    return await result.json();
  }

  /**
   * Query: Get top products (tối ưu với date filter để partition pruning)
   */
  async getTopProducts(limit: number = 10, startDate?: Date, endDate?: Date) {
    const client = this.clickhouse.getClient();
    
    // Luôn yêu cầu date filter để tối ưu partition pruning
    if (!startDate || !endDate) {
      // Default to last 30 days nếu không có date filter
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }
    
    const query = `
      SELECT
        product_id,
        sum(total_amount) AS total_revenue,
        count() AS order_count
      FROM fact_order
      WHERE status != 'CANCELLED'
        AND order_date >= {startDate:Date}
        AND order_date <= {endDate:Date}
      GROUP BY product_id
      ORDER BY total_revenue DESC
      LIMIT {limit:UInt32}
    `;

    const params = {
      limit,
      startDate,
      endDate,
    };

    const result = await client.query({
      query,
      query_params: params,
      format: 'JSONEachRow',
      request_timeout: 30000, // 30 seconds timeout
    });

    return await result.json();
  }

  /**
   * Graceful shutdown - flush all buffers
   */
  async onModuleDestroy() {
    await this.flushAllBuffers();
    // Clear all timers
    this.flushTimers.forEach(timer => clearTimeout(timer));
    this.flushTimers.clear();
  }
}

