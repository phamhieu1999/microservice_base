import { createClient, ClickHouseClient } from '@clickhouse/client';

/**
 * Migration script to create ClickHouse schema for Warehouse Service
 * 
 * Usage:
 *   From host machine (default uses localhost):
 *     npm run migration
 *     # or with custom config:
 *     CLICKHOUSE_HOST=localhost CLICKHOUSE_PORT=8123 CLICKHOUSE_USER=warehouse_user CLICKHOUSE_PASSWORD=warehouse_password CLICKHOUSE_DB=warehouse_db npm run migration
 * 
 *   From Docker container (use clickhouse hostname):
 *     CLICKHOUSE_HOST=clickhouse CLICKHOUSE_PORT=8123 CLICKHOUSE_USER=warehouse_user CLICKHOUSE_PASSWORD=warehouse_password CLICKHOUSE_DB=warehouse_db npm run migration
 */
export async function runMigration() {
  // Get connection config from environment variables
  // Default to 'localhost' for running from host machine, use 'clickhouse' when running in Docker container
  const host = process.env.CLICKHOUSE_HOST || 'localhost';
  const port = parseInt(process.env.CLICKHOUSE_PORT || '8123', 10);
  const username = process.env.CLICKHOUSE_USER || 'warehouse_user';
  const password = process.env.CLICKHOUSE_PASSWORD || 'warehouse_password';
  const database = process.env.CLICKHOUSE_DB || 'warehouse_db';
  const enableHttps = process.env.CLICKHOUSE_ENABLE_HTTPS === 'true';
  const httpsPort = parseInt(process.env.CLICKHOUSE_HTTPS_PORT || '8443', 10);

  // Build connection URL
  const protocol = enableHttps ? 'https' : 'http';
  const connectionPort = enableHttps ? httpsPort : port;
  const connectionHost = `${protocol}://${host}:${connectionPort}`;

  let client: ClickHouseClient | null = null;

  try {
    console.log(`🔄 Connecting to ClickHouse at ${connectionHost}...`);

    const clientConfig: any = {
      host: connectionHost,
      username,
      password,
      database,
      max_open_connections: 10,
      request_timeout: 30000,
      compression: {
        request: true,
        response: true,
      },
    };

    client = createClient(clientConfig);

    // Test connection
    await client.ping();
    console.log('✅ Connected to ClickHouse');

    // Run migration
    console.log('🔄 Running migration...');
    await initializeSchema(client);
    console.log('✅ Migration completed successfully');

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

/**
 * Initialize ClickHouse schema (fact + dimension tables)
 * Exported để có thể sử dụng trong ClickHouseService
 */
export async function initializeSchema(client: ClickHouseClient) {
  try {
    // Create database if not exists
    console.log('  📦 Creating database...');
    await client.command({
      query: `CREATE DATABASE IF NOT EXISTS warehouse_db`,
    });

    // Dimension: dim_date
    console.log('  📊 Creating dim_date table...');
    await client.command({
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
    console.log('  👤 Creating dim_user table...');
    await client.command({
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

    // Dimension: dim_user_activity (aggregated user metrics from multiple events)
    console.log('  👤 Creating dim_user_activity table...');
    await client.command({
      query: `CREATE TABLE IF NOT EXISTS dim_user_activity
      (
        user_id String,
        email String,
        role String,
        first_order_date Nullable(Date),
        last_order_datetime Nullable(DateTime),
        total_orders UInt64,
        total_order_amount Decimal(18, 2),
        last_payment_datetime Nullable(DateTime),
        total_paid_amount Decimal(18, 2),
        loyalty_points Int64,
        updated_at DateTime DEFAULT now()
      )
      ENGINE = ReplacingMergeTree(updated_at)
      ORDER BY user_id`,
    });

    // Dimension: dim_seller_activity (aggregated seller metrics from order, payment, settlement events)
    console.log('  🏪 Creating dim_seller_activity table...');
    await client.command({
      query: `CREATE TABLE IF NOT EXISTS dim_seller_activity
      (
        seller_id String,
        total_orders UInt64,
        total_order_amount Decimal(18, 2),
        total_paid_amount Decimal(18, 2),
        total_net_revenue Decimal(18, 2),
        total_commission Decimal(18, 2),
        total_payout_amount Decimal(18, 2),
        first_order_date Nullable(Date),
        last_order_datetime Nullable(DateTime),
        last_settlement_datetime Nullable(DateTime),
        updated_at DateTime DEFAULT now()
      )
      ENGINE = ReplacingMergeTree(updated_at)
      ORDER BY seller_id`,
    });

    // Dimension: dim_product_activity (aggregated product metrics from order, product events)
    console.log('  📦 Creating dim_product_activity table...');
    await client.command({
      query: `CREATE TABLE IF NOT EXISTS dim_product_activity
      (
        product_id String,
        name String,
        category String,
        brand String,
        seller_id String,
        price Decimal(10, 2),
        total_sold UInt64,
        total_revenue Decimal(18, 2),
        total_orders UInt64,
        first_sold_date Nullable(Date),
        last_sold_datetime Nullable(DateTime),
        updated_at DateTime DEFAULT now()
      )
      ENGINE = ReplacingMergeTree(updated_at)
      ORDER BY product_id`,
    });

    // Dimension: dim_product
    console.log('  📦 Creating dim_product table...');
    await client.command({
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
    console.log('  🏪 Creating dim_seller table...');
    await client.command({
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
    console.log('  🛒 Creating fact_order table...');
    await client.command({
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
    console.log('  💳 Creating fact_payment table...');
    await client.command({
      query: `CREATE TABLE IF NOT EXISTS fact_payment
      (
        payment_id String,
        order_id String,
        user_id String,
        seller_id String,
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

    // Add seller_id column if table exists but column is missing
    // Note: This will fail silently if column already exists, which is fine
    try {
      await client.command({
        query: `ALTER TABLE fact_payment ADD COLUMN seller_id String AFTER user_id`,
      });
      console.log('  ✅ Added seller_id column to fact_payment');
    } catch (error) {
      // Column might already exist or table doesn't exist yet, continue silently
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        console.log('  ✅ Verified fact_payment.seller_id column already exists');
      }
      // Ignore other errors (table might not exist yet, will be created above)
    }

    // Fact: fact_settlement
    console.log('  💰 Creating fact_settlement table...');
    await client.command({
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
    console.log('  ⭐ Creating fact_loyalty table...');
    await client.command({
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
    console.log('  📈 Creating mv_daily_revenue materialized view...');
    // Drop existing view if it exists (to recreate with correct schema)
    try {
      await client.command({
        query: `DROP VIEW IF EXISTS mv_daily_revenue`,
      });
    } catch (error) {
      // Ignore errors when dropping
    }
    
    await client.command({
      query: `CREATE MATERIALIZED VIEW mv_daily_revenue
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

    console.log('  ✅ All tables and views created successfully');
  } catch (error) {
    console.error('  ❌ Failed to initialize schema:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

