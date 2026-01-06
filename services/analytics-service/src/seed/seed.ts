import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { RevenueMetric, RevenueMetricSchema, RevenueMetricDocument } from '../modules/analytics/schemas/revenue-metric.schema';
import { ProductMetric, ProductMetricSchema, ProductMetricDocument } from '../modules/analytics/schemas/product-metric.schema';
import { UserMetric, UserMetricSchema, UserMetricDocument } from '../modules/analytics/schemas/user-metric.schema';
import { SellerMetric, SellerMetricSchema, SellerMetricDocument } from '../modules/analytics/schemas/seller-metric.schema';
import { Model } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const connection = app.get<Connection>(getConnectionToken());
    
    // Get or create models (check if model exists first)
    const RevenueMetricModel = (connection.models[RevenueMetric.name] || 
      connection.model<RevenueMetricDocument>(RevenueMetric.name, RevenueMetricSchema)) as Model<RevenueMetricDocument>;
    const ProductMetricModel = (connection.models[ProductMetric.name] || 
      connection.model<ProductMetricDocument>(ProductMetric.name, ProductMetricSchema)) as Model<ProductMetricDocument>;
    const UserMetricModel = (connection.models[UserMetric.name] || 
      connection.model<UserMetricDocument>(UserMetric.name, UserMetricSchema)) as Model<UserMetricDocument>;
    const SellerMetricModel = (connection.models[SellerMetric.name] || 
      connection.model<SellerMetricDocument>(SellerMetric.name, SellerMetricSchema)) as Model<SellerMetricDocument>;

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
  } catch (error) {
    console.error('❌ Error seeding analytics data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();

