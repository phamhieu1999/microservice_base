import { createClient, ClickHouseClient } from '@clickhouse/client';

/**
 * Helper function to format Date for ClickHouse
 */
function formatDateForClickHouse(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Seed data script để tạo dữ liệu mẫu cho Warehouse Service
 * 
 * Usage:
 *   npm run seed
 *   # or with custom config:
 *   CLICKHOUSE_HOST=localhost CLICKHOUSE_PORT=8123 CLICKHOUSE_USER=warehouse_user CLICKHOUSE_PASSWORD=warehouse_password CLICKHOUSE_DB=warehouse_db npm run seed
 */
export async function seedData() {
  // Get connection config from environment variables
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

    // Generate seed data
    console.log('🌱 Generating seed data...');

    // 1. Seed dimension tables
    await seedDimensions(client);
    
    // 2. Seed fact tables
    await seedFacts(client);

    console.log('✅ Seed data completed successfully');

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed data failed:', error);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

/**
 * Seed dimension tables
 */
async function seedDimensions(client: ClickHouseClient) {
  console.log('  📊 Seeding dimension tables...');

  // Seed dim_user
  const users = [];
  for (let i = 1; i <= 50; i++) {
    const createdAt = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    users.push({
      user_id: `user_${i}`,
      email: `user${i}@example.com`,
      role: i <= 5 ? 'ADMIN' : i <= 20 ? 'SELLER' : 'CUSTOMER',
      created_at: formatDateForClickHouse(createdAt),
    });
  }
  await client.insert({
    table: 'dim_user',
    values: users,
    format: 'JSONEachRow',
  });
  console.log(`  ✅ Inserted ${users.length} users`);

  // Seed dim_seller
  const sellers = [];
  for (let i = 1; i <= 15; i++) {
    const createdAt = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    sellers.push({
      seller_id: `seller_${i}`,
      shop_name: `Shop ${i}`,
      created_at: formatDateForClickHouse(createdAt),
    });
  }
  await client.insert({
    table: 'dim_seller',
    values: sellers,
    format: 'JSONEachRow',
  });
  console.log(`  ✅ Inserted ${sellers.length} sellers`);

  // Seed dim_product
  const products = [];
  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Toys', 'Home', 'Sports'];
  const brands = ['BrandA', 'BrandB', 'BrandC', 'BrandD', 'BrandE'];
  
  for (let i = 1; i <= 100; i++) {
    const createdAt = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    products.push({
      product_id: `product_${i}`,
      name: `Product ${i}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      brand: brands[Math.floor(Math.random() * brands.length)],
      seller_id: `seller_${Math.floor(Math.random() * 15) + 1}`,
      price: Math.round((Math.random() * 1000 + 10) * 100) / 100,
      created_at: formatDateForClickHouse(createdAt),
    });
  }
  await client.insert({
    table: 'dim_product',
    values: products,
    format: 'JSONEachRow',
  });
  console.log(`  ✅ Inserted ${products.length} products`);
}

/**
 * Seed fact tables
 */
async function seedFacts(client: ClickHouseClient) {
  console.log('  📈 Seeding fact tables...');

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 90); // Last 90 days

  // Seed fact_order and fact_payment
  const orders = [];
  const payments = [];
  const settlements = [];
  const loyaltyTransactions = [];

  for (let i = 1; i <= 500; i++) {
    const orderDate = new Date(
      startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime())
    );
    const userId = `user_${Math.floor(Math.random() * 50) + 1}`;
    const sellerId = `seller_${Math.floor(Math.random() * 15) + 1}`;
    const productId = `product_${Math.floor(Math.random() * 100) + 1}`;
    const orderId = `order_${i}`;
    const totalAmount = Math.round((Math.random() * 500 + 10) * 100) / 100;
    const discountAmount = Math.round((Math.random() * 50) * 100) / 100;
    const shippingFee = Math.round((Math.random() * 20 + 5) * 100) / 100;
    const status = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'][
      Math.floor(Math.random() * 5)
    ];

    // Order fact
    const orderDateStr = formatDateForClickHouse(orderDate);
    const orderDateOnly = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD format for Date type
    orders.push({
      order_id: orderId,
      user_id: userId,
      seller_id: sellerId,
      product_id: productId,
      order_group_id: `group_${Math.floor(i / 3) + 1}`,
      voucher_id: Math.random() > 0.7 ? `voucher_${Math.floor(Math.random() * 10) + 1}` : '',
      total_amount: totalAmount,
      discount_amount: discountAmount,
      shipping_fee: shippingFee,
      status,
      order_date: orderDateOnly,
      order_datetime: orderDateStr,
    });

    // Payment fact (only for successful orders)
    if (status !== 'CANCELLED' && Math.random() > 0.2) {
      const paymentDate = new Date(orderDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
      const paymentDateStr = formatDateForClickHouse(paymentDate);
      const paymentDateOnly = paymentDate.toISOString().split('T')[0];
      const paymentAmount = totalAmount - discountAmount;
      const fee = Math.round((paymentAmount * 0.03) * 100) / 100; // 3% fee
      const paymentMethods = ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'WALLET'];
      const providers = ['Stripe', 'PayPal', 'Bank', 'Wallet'];

      payments.push({
        payment_id: `payment_${i}`,
        order_id: orderId,
        user_id: userId,
        seller_id: sellerId,
        amount: paymentAmount,
        fee,
        payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        provider: providers[Math.floor(Math.random() * providers.length)],
        status: 'SUCCESS',
        payment_date: paymentDateOnly,
        payment_datetime: paymentDateStr,
      });

      // Settlement fact (for successful payments)
      if (Math.random() > 0.3) {
        const settlementDate = new Date(paymentDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
        const settlementDateStr = formatDateForClickHouse(settlementDate);
        const settlementDateOnly = settlementDate.toISOString().split('T')[0];
        const commission = Math.round((paymentAmount * 0.1) * 100) / 100; // 10% commission
        const netRevenue = paymentAmount - fee - commission;
        const payoutAmount = netRevenue;

        settlements.push({
          settlement_id: `settlement_${i}`,
          seller_id: sellerId,
          order_id: orderId,
          net_revenue: netRevenue,
          commission,
          payout_amount: payoutAmount,
          payout_status: ['PENDING', 'PROCESSING', 'COMPLETED'][Math.floor(Math.random() * 3)],
          settlement_date: settlementDateOnly,
          settlement_datetime: settlementDateStr,
        });
      }

      // Loyalty fact
      if (Math.random() > 0.4) {
        const pointsEarned = Math.floor(paymentAmount / 10); // 1 point per $10
        const balanceAfter = Math.floor(Math.random() * 10000) + pointsEarned;
        const transactionDateStr = formatDateForClickHouse(paymentDate);
        const transactionDateOnly = paymentDate.toISOString().split('T')[0];

        loyaltyTransactions.push({
          transaction_id: `loyalty_${i}`,
          user_id: userId,
          order_id: orderId,
          points_earned: pointsEarned,
          points_redeemed: 0,
          balance_after: balanceAfter,
          event_type: 'PURCHASE',
          transaction_date: transactionDateOnly,
          transaction_datetime: transactionDateStr,
        });
      }
    }
  }

  // Batch insert
  if (orders.length > 0) {
    await client.insert({
      table: 'fact_order',
      values: orders,
      format: 'JSONEachRow',
    });
    console.log(`  ✅ Inserted ${orders.length} orders`);
  }

  if (payments.length > 0) {
    await client.insert({
      table: 'fact_payment',
      values: payments,
      format: 'JSONEachRow',
    });
    console.log(`  ✅ Inserted ${payments.length} payments`);
  }

  if (settlements.length > 0) {
    await client.insert({
      table: 'fact_settlement',
      values: settlements,
      format: 'JSONEachRow',
    });
    console.log(`  ✅ Inserted ${settlements.length} settlements`);
  }

  if (loyaltyTransactions.length > 0) {
    await client.insert({
      table: 'fact_loyalty',
      values: loyaltyTransactions,
      format: 'JSONEachRow',
    });
    console.log(`  ✅ Inserted ${loyaltyTransactions.length} loyalty transactions`);
  }
}

// Run seed if called directly
if (require.main === module) {
  seedData();
}

