import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClickHouseService } from '../../database/clickhouse.service';

@Injectable()
export class WarehouseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WarehouseService.name);
  
  // Batch buffers để tối ưu insert performance
  private orderFactBuffer: any[] = [];
  private paymentFactBuffer: any[] = [];
  private readonly BATCH_SIZE = 100; // Flush khi đủ 100 records
  private readonly BATCH_TIMEOUT = 5000; // Flush sau 5 giây nếu chưa đủ batch
  private flushTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private autoFlushInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly clickhouse: ClickHouseService) {}

  /**
   * Helper: format Date to ClickHouse Date string 'YYYY-MM-DD'
   */
  private toClickHouseDate(date: Date): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().slice(0, 10);
  }

  /**
   * Helper: format Date to ClickHouse DateTime string 'YYYY-MM-DD HH:MM:SS'
   */
  private toClickHouseDateTime(date: Date): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().replace('T', ' ').slice(0, 19);
  }

  async onModuleInit() {
    // Auto-flush buffers định kỳ - chỉ start sau khi module đã khởi tạo xong
    this.startAutoFlush();
  }

  /**
   * Auto-flush buffers sau một khoảng thời gian
   */
  private startAutoFlush() {
    if (this.autoFlushInterval) {
      clearInterval(this.autoFlushInterval);
    }
    this.autoFlushInterval = setInterval(() => {
      this.flushAllBuffers();
    }, this.BATCH_TIMEOUT);
  }

  /**
   * Flush tất cả buffers
   */
  private async flushAllBuffers() {
    try {
      // Kiểm tra xem ClickHouse client đã sẵn sàng chưa
      this.clickhouse.getClient();
    } catch (error) {
      // Client chưa sẵn sàng, bỏ qua flush lần này
      this.logger.debug('ClickHouse client not ready, skipping buffer flush');
      return;
    }

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
      total_amount: Number(data.totalAmount ?? 0),
      discount_amount: Number(data.discountAmount ?? 0),
      shipping_fee: Number(data.shippingFee ?? 0),
      status: data.status,
      order_date: this.toClickHouseDate(data.orderDate),
      order_datetime: this.toClickHouseDateTime(data.orderDate),
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
    sellerId?: string;
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
      seller_id: data.sellerId || '',
      amount: Number(data.amount ?? 0),
      fee: Number(data.fee ?? 0),
      payment_method: data.paymentMethod,
      provider: data.provider,
      status: data.status,
      payment_date: this.toClickHouseDate(data.paymentDate),
      payment_datetime: this.toClickHouseDateTime(data.paymentDate),
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
      total_amount: Number(data.totalAmount ?? 0),
      discount_amount: Number(data.discountAmount ?? 0),
      shipping_fee: Number(data.shippingFee ?? 0),
      status: data.status,
      order_date: this.toClickHouseDate(data.orderDate),
      order_datetime: this.toClickHouseDateTime(data.orderDate),
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
    sellerId?: string;
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
      seller_id: data.sellerId || '',
      amount: Number(data.amount ?? 0),
      fee: Number(data.fee ?? 0),
      payment_method: data.paymentMethod,
      provider: data.provider,
      status: data.status,
      payment_date: this.toClickHouseDate(data.paymentDate),
      payment_datetime: this.toClickHouseDateTime(data.paymentDate),
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
      net_revenue: Number(data.netRevenue ?? 0),
      commission: Number(data.commission ?? 0),
      payout_amount: Number(data.payoutAmount ?? 0),
      payout_status: data.payoutStatus,
      settlement_date: this.toClickHouseDate(data.settlementDate),
      settlement_datetime: this.toClickHouseDateTime(data.settlementDate),
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
      points_earned: Number(data.pointsEarned ?? 0),
      points_redeemed: Number(data.pointsRedeemed ?? 0),
      balance_after: Number(data.balanceAfter ?? 0),
      event_type: data.eventType,
      transaction_date: this.toClickHouseDate(data.transactionDate),
      transaction_datetime: this.toClickHouseDateTime(data.transactionDate),
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
      created_at: this.toClickHouseDateTime(data.createdAt),
      updated_at: this.toClickHouseDateTime(new Date()),
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
      price: Number(data.price ?? 0),
      created_at: this.toClickHouseDateTime(data.createdAt),
      updated_at: this.toClickHouseDateTime(new Date()),
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
            net_revenue: Number(data.netRevenue ?? 0),
            commission: Number(data.commission ?? 0),
            payout_amount: Number(data.payoutAmount ?? 0),
            payout_status: data.payoutStatus,
            settlement_date: this.toClickHouseDate(data.settlementDate),
            settlement_datetime: this.toClickHouseDateTime(data.settlementDate),
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
            points_earned: Number(data.pointsEarned ?? 0),
            points_redeemed: Number(data.pointsRedeemed ?? 0),
            balance_after: Number(data.balanceAfter ?? 0),
            event_type: data.eventType,
            transaction_date: this.toClickHouseDate(data.transactionDate),
            transaction_datetime: this.toClickHouseDateTime(data.transactionDate),
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
    });

    return await result.json();
  }

  /**
   * Rebuild dim_user_activity snapshot for a given user.
   *
   * This aggregates data from:
   * - dim_user (email, role)
   * - fact_order (orders, order amounts, first/last order)
   * - fact_payment (payments, payment amounts, last payment)
   * - fact_loyalty (latest loyalty balance)
   *
   * It inserts a new snapshot row into dim_user_activity using ReplacingMergeTree(updated_at),
   * so the latest snapshot will be used for analytics.
   */
  async rebuildUserActivity(userId: string): Promise<void> {
    if (!userId) {
      return;
    }

    const client = this.clickhouse.getClient();

    // 1) Base user info from dim_user (latest snapshot)
    let email = '';
    let role = 'USER';
    try {
      const userResult = await client.query({
        query: `
          SELECT
            user_id,
            email,
            role,
            updated_at
          FROM dim_user
          WHERE user_id = {userId:String}
          ORDER BY updated_at DESC
          LIMIT 1
        `,
        query_params: { userId },
        format: 'JSONEachRow',
      });
      const userRows = (await userResult.json()) as Array<{
        user_id: string;
        email: string;
        role: string;
      }>;
      if (userRows.length > 0) {
        email = userRows[0].email || '';
        role = userRows[0].role || 'USER';
      }
    } catch (error) {
      this.logger.error(`Failed to fetch dim_user for user ${userId} when rebuilding dim_user_activity`, error);
    }

    // 2) Aggregate from fact_order
    let firstOrderDate: string | null = null;
    let lastOrderDateTime: string | null = null;
    let totalOrders = 0;
    let totalOrderAmount = 0;
    try {
      const orderResult = await client.query({
        query: `
          SELECT
            count() AS total_orders,
            coalesce(sum(total_amount), 0) AS total_order_amount,
            toString(min(order_date)) AS first_order_date,
            toString(max(order_datetime)) AS last_order_datetime
          FROM fact_order
          WHERE user_id = {userId:String}
            AND status != 'CANCELLED'
        `,
        query_params: { userId },
        format: 'JSONEachRow',
      });
      const orderRows = (await orderResult.json()) as Array<{
        total_orders: string | number;
        total_order_amount: string | number;
        first_order_date?: string;
        last_order_datetime?: string;
      }>;
      if (orderRows.length > 0) {
        const row = orderRows[0];
        totalOrders = Number(row.total_orders || 0);
        totalOrderAmount = Number(row.total_order_amount || 0);
        // ClickHouse returns '1970-01-01' / '0000-00-00' when no rows match min/max
        const fod = row.first_order_date;
        firstOrderDate = (fod && fod !== '1970-01-01' && fod !== '0000-00-00') ? fod : null;
        const lod = row.last_order_datetime;
        lastOrderDateTime = (lod && lod !== '1970-01-01 00:00:00' && lod !== '0000-00-00 00:00:00') ? lod : null;
      }
    } catch (error) {
      this.logger.error(`Failed to aggregate fact_order for user ${userId} when rebuilding dim_user_activity`, error);
    }

    // 3) Aggregate from fact_payment
    let lastPaymentDateTime: string | null = null;
    let totalPaidAmount = 0;
    try {
      const paymentResult = await client.query({
        query: `
          SELECT
            coalesce(sum(amount), 0) AS total_paid_amount,
            toString(max(payment_datetime)) AS last_payment_datetime
          FROM fact_payment
          WHERE user_id = {userId:String}
            AND status = 'SUCCESS'
        `,
        query_params: { userId },
        format: 'JSONEachRow',
      });
      const paymentRows = (await paymentResult.json()) as Array<{
        total_paid_amount: string | number;
        last_payment_datetime?: string;
      }>;
      if (paymentRows.length > 0) {
        const row = paymentRows[0];
        totalPaidAmount = Number(row.total_paid_amount || 0);
        const lpd = row.last_payment_datetime;
        lastPaymentDateTime = (lpd && lpd !== '1970-01-01 00:00:00' && lpd !== '0000-00-00 00:00:00') ? lpd : null;
      }
    } catch (error) {
      this.logger.error(`Failed to aggregate fact_payment for user ${userId} when rebuilding dim_user_activity`, error);
    }

    // 4) Latest loyalty balance from fact_loyalty
    let loyaltyPoints = 0;
    try {
      const loyaltyResult = await client.query({
        query: `
          SELECT
            balance_after AS loyalty_points
          FROM fact_loyalty
          WHERE user_id = {userId:String}
          ORDER BY transaction_datetime DESC
          LIMIT 1
        `,
        query_params: { userId },
        format: 'JSONEachRow',
      });
      const loyaltyRows = (await loyaltyResult.json()) as Array<{
        loyalty_points: string | number;
      }>;
      if (loyaltyRows.length > 0) {
        loyaltyPoints = Number(loyaltyRows[0].loyalty_points || 0);
      }
    } catch (error) {
      this.logger.error(`Failed to aggregate fact_loyalty for user ${userId} when rebuilding dim_user_activity`, error);
    }

    // 5) Build the row, omitting Nullable fields when null
    const row: Record<string, any> = {
      user_id: userId,
      email,
      role,
      total_orders: totalOrders,
      total_order_amount: Number(totalOrderAmount),
      total_paid_amount: Number(totalPaidAmount),
      loyalty_points: Number(loyaltyPoints),
      updated_at: this.toClickHouseDateTime(new Date()),
    };

    // Only include Nullable date/datetime fields when they have a real value
    if (firstOrderDate) {
      row.first_order_date = firstOrderDate;  // already 'YYYY-MM-DD' string
    }
    if (lastOrderDateTime) {
      row.last_order_datetime = lastOrderDateTime;  // already 'YYYY-MM-DD HH:MM:SS' string
    }
    if (lastPaymentDateTime) {
      row.last_payment_datetime = lastPaymentDateTime;  // already 'YYYY-MM-DD HH:MM:SS' string
    }

    // 6) Insert snapshot into dim_user_activity
    try {
      await client.insert({
        table: 'dim_user_activity',
        values: [row],
        format: 'JSONEachRow',
      });

      this.logger.debug(`Rebuilt dim_user_activity snapshot for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to insert dim_user_activity snapshot for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Rebuild dim_seller_activity snapshot for a given seller.
   *
   * Aggregates data from:
   * - fact_order (orders by seller, revenue)
   * - fact_payment (payments by seller)
   * - fact_settlement (net revenue, commission, payout)
   */
  async rebuildSellerActivity(sellerId: string): Promise<void> {
    if (!sellerId) return;

    const client = this.clickhouse.getClient();

    // 1) Aggregate from fact_order
    let totalOrders = 0;
    let totalOrderAmount = 0;
    let firstOrderDate: string | null = null;
    let lastOrderDateTime: string | null = null;
    try {
      const result = await client.query({
        query: `
          SELECT
            count() AS total_orders,
            coalesce(sum(total_amount), 0) AS total_order_amount,
            toString(min(order_date)) AS first_order_date,
            toString(max(order_datetime)) AS last_order_datetime
          FROM fact_order
          WHERE seller_id = {sellerId:String}
            AND status != 'CANCELLED'
        `,
        query_params: { sellerId },
        format: 'JSONEachRow',
      });
      const rows = (await result.json()) as any[];
      if (rows.length > 0) {
        totalOrders = Number(rows[0].total_orders || 0);
        totalOrderAmount = Number(rows[0].total_order_amount || 0);
        const fod = rows[0].first_order_date;
        firstOrderDate = (fod && fod !== '1970-01-01' && fod !== '0000-00-00') ? fod : null;
        const lod = rows[0].last_order_datetime;
        lastOrderDateTime = (lod && lod !== '1970-01-01 00:00:00' && lod !== '0000-00-00 00:00:00') ? lod : null;
      }
    } catch (error) {
      this.logger.error(`Failed to aggregate fact_order for seller ${sellerId}`, error);
    }

    // 2) Aggregate from fact_payment
    let totalPaidAmount = 0;
    try {
      const result = await client.query({
        query: `
          SELECT coalesce(sum(amount), 0) AS total_paid_amount
          FROM fact_payment
          WHERE seller_id = {sellerId:String}
            AND status = 'SUCCESS'
        `,
        query_params: { sellerId },
        format: 'JSONEachRow',
      });
      const rows = (await result.json()) as any[];
      if (rows.length > 0) {
        totalPaidAmount = Number(rows[0].total_paid_amount || 0);
      }
    } catch (error) {
      this.logger.error(`Failed to aggregate fact_payment for seller ${sellerId}`, error);
    }

    // 3) Aggregate from fact_settlement
    let totalNetRevenue = 0;
    let totalCommission = 0;
    let totalPayoutAmount = 0;
    let lastSettlementDateTime: string | null = null;
    try {
      const result = await client.query({
        query: `
          SELECT
            coalesce(sum(net_revenue), 0) AS total_net_revenue,
            coalesce(sum(commission), 0) AS total_commission,
            coalesce(sum(payout_amount), 0) AS total_payout_amount,
            toString(max(settlement_datetime)) AS last_settlement_datetime
          FROM fact_settlement
          WHERE seller_id = {sellerId:String}
        `,
        query_params: { sellerId },
        format: 'JSONEachRow',
      });
      const rows = (await result.json()) as any[];
      if (rows.length > 0) {
        totalNetRevenue = Number(rows[0].total_net_revenue || 0);
        totalCommission = Number(rows[0].total_commission || 0);
        totalPayoutAmount = Number(rows[0].total_payout_amount || 0);
        const lsd = rows[0].last_settlement_datetime;
        lastSettlementDateTime = (lsd && lsd !== '1970-01-01 00:00:00' && lsd !== '0000-00-00 00:00:00') ? lsd : null;
      }
    } catch (error) {
      this.logger.error(`Failed to aggregate fact_settlement for seller ${sellerId}`, error);
    }

    // 4) Build row
    const row: Record<string, any> = {
      seller_id: sellerId,
      total_orders: totalOrders,
      total_order_amount: Number(totalOrderAmount),
      total_paid_amount: Number(totalPaidAmount),
      total_net_revenue: Number(totalNetRevenue),
      total_commission: Number(totalCommission),
      total_payout_amount: Number(totalPayoutAmount),
      updated_at: this.toClickHouseDateTime(new Date()),
    };
    if (firstOrderDate) row.first_order_date = firstOrderDate;
    if (lastOrderDateTime) row.last_order_datetime = lastOrderDateTime;
    if (lastSettlementDateTime) row.last_settlement_datetime = lastSettlementDateTime;

    // 5) Insert snapshot
    try {
      await client.insert({
        table: 'dim_seller_activity',
        values: [row],
        format: 'JSONEachRow',
      });
      this.logger.debug(`Rebuilt dim_seller_activity snapshot for seller ${sellerId}`);
    } catch (error) {
      this.logger.error(`Failed to insert dim_seller_activity snapshot for seller ${sellerId}`, error);
      throw error;
    }
  }

  /**
   * Rebuild dim_product_activity snapshot for a given product.
   *
   * Aggregates data from:
   * - dim_product (name, category, brand, seller_id, price)
   * - fact_order (total sold, revenue, order count)
   */
  async rebuildProductActivity(productId: string): Promise<void> {
    if (!productId) return;

    const client = this.clickhouse.getClient();

    // 1) Base product info from dim_product
    let name = '';
    let category = '';
    let brand = '';
    let sellerId = '';
    let price = 0;
    try {
      const result = await client.query({
        query: `
          SELECT name, category, brand, seller_id, price
          FROM dim_product
          WHERE product_id = {productId:String}
          ORDER BY updated_at DESC
          LIMIT 1
        `,
        query_params: { productId },
        format: 'JSONEachRow',
      });
      const rows = (await result.json()) as any[];
      if (rows.length > 0) {
        name = rows[0].name || '';
        category = rows[0].category || '';
        brand = rows[0].brand || '';
        sellerId = rows[0].seller_id || '';
        price = Number(rows[0].price || 0);
      }
    } catch (error) {
      this.logger.error(`Failed to fetch dim_product for product ${productId}`, error);
    }

    // 2) Aggregate from fact_order
    let totalSold = 0;
    let totalRevenue = 0;
    let totalOrders = 0;
    let firstSoldDate: string | null = null;
    let lastSoldDateTime: string | null = null;
    try {
      const result = await client.query({
        query: `
          SELECT
            count() AS total_orders,
            coalesce(sum(total_amount), 0) AS total_revenue,
            toString(min(order_date)) AS first_sold_date,
            toString(max(order_datetime)) AS last_sold_datetime
          FROM fact_order
          WHERE product_id = {productId:String}
            AND status != 'CANCELLED'
        `,
        query_params: { productId },
        format: 'JSONEachRow',
      });
      const rows = (await result.json()) as any[];
      if (rows.length > 0) {
        totalOrders = Number(rows[0].total_orders || 0);
        totalSold = totalOrders; // each fact_order row = 1 order item
        totalRevenue = Number(rows[0].total_revenue || 0);
        const fsd = rows[0].first_sold_date;
        firstSoldDate = (fsd && fsd !== '1970-01-01' && fsd !== '0000-00-00') ? fsd : null;
        const lsd = rows[0].last_sold_datetime;
        lastSoldDateTime = (lsd && lsd !== '1970-01-01 00:00:00' && lsd !== '0000-00-00 00:00:00') ? lsd : null;
      }
    } catch (error) {
      this.logger.error(`Failed to aggregate fact_order for product ${productId}`, error);
    }

    // 3) Build row
    const row: Record<string, any> = {
      product_id: productId,
      name,
      category,
      brand,
      seller_id: sellerId,
      price: Number(price),
      total_sold: totalSold,
      total_revenue: Number(totalRevenue),
      total_orders: totalOrders,
      updated_at: this.toClickHouseDateTime(new Date()),
    };
    if (firstSoldDate) row.first_sold_date = firstSoldDate;
    if (lastSoldDateTime) row.last_sold_datetime = lastSoldDateTime;

    // 4) Insert snapshot
    try {
      await client.insert({
        table: 'dim_product_activity',
        values: [row],
        format: 'JSONEachRow',
      });
      this.logger.debug(`Rebuilt dim_product_activity snapshot for product ${productId}`);
    } catch (error) {
      this.logger.error(`Failed to insert dim_product_activity snapshot for product ${productId}`, error);
      throw error;
    }
  }

  /**
   * Graceful shutdown - flush all buffers
   */
  async onModuleDestroy() {
    // Clear auto-flush interval
    if (this.autoFlushInterval) {
      clearInterval(this.autoFlushInterval);
      this.autoFlushInterval = null;
    }
    
    await this.flushAllBuffers();
    // Clear all timers
    this.flushTimers.forEach(timer => clearTimeout(timer));
    this.flushTimers.clear();
  }
}

