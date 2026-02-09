import * as mongoose from 'mongoose';
import { RevenueMetricSchema } from '../modules/analytics/schemas/revenue-metric.schema';
import { ProductMetricSchema } from '../modules/analytics/schemas/product-metric.schema';
import { UserMetricSchema } from '../modules/analytics/schemas/user-metric.schema';
import { SellerMetricSchema } from '../modules/analytics/schemas/seller-metric.schema';

async function seed() {
  // Determine MongoDB URI
  // Priority: 1. ANALYTICS_MONGO_URI env var, 2. Use localhost (for local development)
  // For Docker containers, set ANALYTICS_MONGO_URI=mongodb://mongo:27017/analytics_db
  const mongoUri = process.env.ANALYTICS_MONGO_URI || 'mongodb://localhost:27017/analytics_db';
  
  try {
    console.log(`🔄 Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const RevenueMetricModel = mongoose.model('RevenueMetric', RevenueMetricSchema);
    const ProductMetricModel = mongoose.model('ProductMetric', ProductMetricSchema);
    const UserMetricModel = mongoose.model('UserMetric', UserMetricSchema);
    const SellerMetricModel = mongoose.model('SellerMetric', SellerMetricSchema);

    console.log('🌱 Starting analytics data seeding...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    await RevenueMetricModel.deleteMany({});
    await ProductMetricModel.deleteMany({});
    await UserMetricModel.deleteMany({});
    await SellerMetricModel.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Seed Revenue Metrics (last 30 days)
    const revenueMetrics = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const revenue = Math.floor(Math.random() * 50000000) + 10000000; // 10M - 60M VND
      const orderCount = Math.floor(Math.random() * 500) + 100; // 100 - 600 orders
      const avgOrderValue = revenue / orderCount;

      revenueMetrics.push({
        date,
        revenue,
        orderCount,
        averageOrderValue: Math.round(avgOrderValue),
        period: 'daily' as const,
      });
    }
    await RevenueMetricModel.insertMany(revenueMetrics);
    console.log(`✅ Seeded ${revenueMetrics.length} revenue metrics`);

    // Seed Product Metrics
    const productMetrics = [];
    const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Home & Garden'];
    const productNames = [
      'iPhone 15 Pro Max',
      'Samsung Galaxy S24',
      'MacBook Pro M3',
      'Nike Air Max',
      'Adidas Ultraboost',
      'Coffee Maker Deluxe',
      'Wireless Headphones',
      'Smart Watch',
      'Gaming Mouse',
      'Mechanical Keyboard',
      'Laptop Stand',
      'USB-C Hub',
      'Power Bank 20000mAh',
      'Bluetooth Speaker',
      'Webcam HD',
    ];

    for (let i = 0; i < 50; i++) {
      const productId = `prod_${String(i + 1).padStart(3, '0')}`;
      const salesCount = Math.floor(Math.random() * 1000) + 10;
      const revenue = Math.floor(Math.random() * 50000000) + 1000000; // 1M - 51M VND
      const views = Math.floor(salesCount * (Math.random() * 10 + 5)); // 5-15x sales
      const conversionRate = (salesCount / views) * 100;

      productMetrics.push({
        productId,
        productName: productNames[i % productNames.length],
        salesCount,
        revenue,
        views,
        conversionRate: Math.round(conversionRate * 100) / 100,
        category: categories[i % categories.length],
        sellerId: `seller_${String((i % 10) + 1).padStart(3, '0')}`,
      });
    }
    await ProductMetricModel.insertMany(productMetrics);
    console.log(`✅ Seeded ${productMetrics.length} product metrics`);

    // Seed User Metrics (last 30 days)
    const userMetrics = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dailyActiveUsers = Math.floor(Math.random() * 5000) + 1000; // 1K - 6K DAU
      const monthlyActiveUsers = Math.floor(Math.random() * 50000) + 20000; // 20K - 70K MAU
      const newUsers = Math.floor(Math.random() * 500) + 50; // 50 - 550 new users
      const retentionRate = Math.random() * 30 + 40; // 40% - 70%

      userMetrics.push({
        date,
        dailyActiveUsers,
        monthlyActiveUsers,
        newUsers,
        retentionRate: Math.round(retentionRate * 100) / 100,
      });
    }
    await UserMetricModel.insertMany(userMetrics);
    console.log(`✅ Seeded ${userMetrics.length} user metrics`);

    // Seed Seller Metrics
    const sellerMetrics = [];
    for (let i = 1; i <= 10; i++) {
      const sellerId = `seller_${String(i).padStart(3, '0')}`;
      const totalNetRevenue = Math.floor(Math.random() * 200000000) + 50000000; // 50M - 250M VND
      const totalCommission = Math.floor(totalNetRevenue * 0.1); // 10% commission
      const totalPayout = Math.floor(totalNetRevenue * 0.8); // 80% payout

      sellerMetrics.push({
        sellerId,
        totalNetRevenue,
        totalCommission,
        totalPayout,
      });
    }
    await SellerMetricModel.insertMany(sellerMetrics);
    console.log(`✅ Seeded ${sellerMetrics.length} seller metrics`);

    console.log('🎉 Analytics data seeding completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding analytics data:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();

