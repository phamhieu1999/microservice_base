import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

@Injectable()
export class ClickHouseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClickHouseService.name);
  private client: ClickHouseClient;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const host = this.configService.get<string>('CLICKHOUSE_HOST', 'clickhouse');
      const port = this.configService.get<number>('CLICKHOUSE_PORT', 8123);
      const username = this.configService.get<string>('CLICKHOUSE_USER', 'default');
      const password = this.configService.get<string>('CLICKHOUSE_PASSWORD', '');
      const database = this.configService.get<string>('CLICKHOUSE_DB', 'warehouse_db');
      const enableHttps = this.configService.get<boolean>('CLICKHOUSE_ENABLE_HTTPS', false);
      const httpsPort = this.configService.get<number>('CLICKHOUSE_HTTPS_PORT', 8443);

      // Build connection URL
      const protocol = enableHttps ? 'https' : 'http';
      const connectionPort = enableHttps ? httpsPort : port;
      const connectionHost = `${protocol}://${host}:${connectionPort}`;

      // Validate password strength (warn nếu password rỗng hoặc yếu)
      if (!password || password.length < 8) {
        this.logger.warn(
          'ClickHouse password is empty or weak. Please set a strong password for production!'
        );
      }

      const clientConfig: any = {
        host: connectionHost,
        username,
        password,
        database,
        // Connection pooling để tối ưu performance
        max_open_connections: 10,
        request_timeout: 30000, // 30 seconds timeout
        // Compression để giảm bandwidth
        compression: {
          request: true,
          response: true,
        },
      };

      // TODO: Add HTTPS/TLS configuration (cần certificates)
      // if (enableHttps) {
      //   clientConfig.ca = fs.readFileSync(this.configService.get<string>('CLICKHOUSE_CA_CERT_PATH'), 'utf-8');
      //   clientConfig.cert = fs.readFileSync(this.configService.get<string>('CLICKHOUSE_CLIENT_CERT_PATH'), 'utf-8');
      //   clientConfig.key = fs.readFileSync(this.configService.get<string>('CLICKHOUSE_CLIENT_KEY_PATH'), 'utf-8');
      // }

      this.client = createClient(clientConfig);

      // Test connection với retry logic
      const maxRetries = 5;
      let retryCount = 0;
      let connected = false;

      while (retryCount < maxRetries && !connected) {
        try {
          await this.client.ping();
          connected = true;
          this.logger.log(
            `Connected to ClickHouse at ${connectionHost} with connection pooling${enableHttps ? ' (HTTPS)' : ''}`
          );
          
          // Initialize schema
          await this.initializeSchema();
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries) {
            const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
            this.logger.warn(
              `Failed to connect to ClickHouse (attempt ${retryCount}/${maxRetries}). Retrying in ${backoffMs}ms...`,
              error instanceof Error ? error.message : 'Unknown error'
            );
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          } else {
            this.logger.error(
              `Failed to connect to ClickHouse after ${maxRetries} attempts. Service will continue but ClickHouse features will be unavailable.`,
              error instanceof Error ? error.message : 'Unknown error'
            );
            // Không throw error để service vẫn có thể khởi động
          }
        }
      }
    } catch (error) {
      this.logger.error(
        'Error initializing ClickHouse service',
        error instanceof Error ? error.message : 'Unknown error'
      );
      // Không throw error để service vẫn có thể khởi động
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log('ClickHouse connection closed');
    }
  }

  getClient(): ClickHouseClient {
    if (!this.client) {
      throw new Error('ClickHouse client is not initialized. Please check connection.');
    }
    return this.client;
  }

  /**
   * Check if ClickHouse client is ready
   */
  isClientReady(): boolean {
    return !!this.client;
  }

  /**
   * Initialize ClickHouse schema (fact + dimension tables)
   */
  private async initializeSchema() {
    try {
      // Create database if not exists
      await this.client.command({
        query: `CREATE DATABASE IF NOT EXISTS warehouse_db`,
      });

      // Dimension: dim_date
      await this.client.command({
        query: `CREATE TABLE IF NOT EXISTS dim_date
        (
          date Date,
          year UInt16,
          month UInt8,
          day UInt8,
          quarter UInt8,
          week UInt8,
          day_of_week UInt8,
          is_weekend UInt8,
          is_holiday UInt8,
          created_at DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        ORDER BY date`,
      });

      // Dimension: dim_user
      await this.client.command({
        query: `CREATE TABLE IF NOT EXISTS dim_user
        (
          user_id String,
          email String,
          role String,
          created_at DateTime,
          updated_at DateTime DEFAULT now()
        )
        ENGINE = ReplacingMergeTree(updated_at)
        ORDER BY user_id`,
      });

      // Dimension: dim_product
      await this.client.command({
        query: `CREATE TABLE IF NOT EXISTS dim_product
        (
          product_id String,
          name String,
          category String,
          brand String,
          seller_id String,
          price Decimal(10, 2),
          created_at DateTime,
          updated_at DateTime DEFAULT now()
        )
        ENGINE = ReplacingMergeTree(updated_at)
        ORDER BY product_id`,
      });

      // Dimension: dim_seller
      await this.client.command({
        query: `CREATE TABLE IF NOT EXISTS dim_seller
        (
          seller_id String,
          shop_name String,
          created_at DateTime,
          updated_at DateTime DEFAULT now()
        )
        ENGINE = ReplacingMergeTree(updated_at)
        ORDER BY seller_id`,
      });

      // Fact: fact_order
      await this.client.command({
        query: `CREATE TABLE IF NOT EXISTS fact_order
        (
          order_id String,
          user_id String,
          seller_id String,
          product_id String,
          order_group_id String,
          voucher_id String,
          total_amount Decimal(10, 2),
          discount_amount Decimal(10, 2),
          shipping_fee Decimal(10, 2),
          status String,
          order_date Date,
          order_datetime DateTime,
          created_at DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        ORDER BY (order_date, order_id)
        PARTITION BY toYYYYMM(order_date)`,
      });

      // Fact: fact_payment
      await this.client.command({
        query: `CREATE TABLE IF NOT EXISTS fact_payment
        (
          payment_id String,
          order_id String,
          user_id String,
          amount Decimal(10, 2),
          fee Decimal(10, 2),
          payment_method String,
          provider String,
          status String,
          payment_date Date,
          payment_datetime DateTime,
          created_at DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        ORDER BY (payment_date, payment_id)
        PARTITION BY toYYYYMM(payment_date)`,
      });

      // Fact: fact_settlement
      await this.client.command({
        query: `CREATE TABLE IF NOT EXISTS fact_settlement
        (
          settlement_id String,
          seller_id String,
          order_id String,
          net_revenue Decimal(10, 2),
          commission Decimal(10, 2),
          payout_amount Decimal(10, 2),
          payout_status String,
          settlement_date Date,
          settlement_datetime DateTime,
          created_at DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        ORDER BY (settlement_date, seller_id)
        PARTITION BY toYYYYMM(settlement_date)`,
      });

      // Fact: fact_loyalty
      await this.client.command({
        query: `CREATE TABLE IF NOT EXISTS fact_loyalty
        (
          transaction_id String,
          user_id String,
          order_id String,
          points_earned Int32,
          points_redeemed Int32,
          balance_after Int32,
          event_type String,
          transaction_date Date,
          transaction_datetime DateTime,
          created_at DateTime DEFAULT now()
        )
        ENGINE = MergeTree()
        ORDER BY (transaction_date, user_id)
        PARTITION BY toYYYYMM(transaction_date)`,
      });

      // Materialized view: Daily revenue summary
      await this.client.command({
        query: `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_revenue
        ENGINE = SummingMergeTree()
        ORDER BY (revenue_date, seller_id)
        AS SELECT
          toDate(payment_datetime) AS revenue_date,
          seller_id,
          sum(amount) AS total_revenue,
          count() AS order_count
        FROM fact_payment
        WHERE status = 'SUCCESS'
        GROUP BY revenue_date, seller_id`,
      });

      this.logger.log('ClickHouse schema initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize ClickHouse schema', error);
      throw error;
    }
  }
}

