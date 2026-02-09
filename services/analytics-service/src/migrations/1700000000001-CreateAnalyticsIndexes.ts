import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { RevenueMetric, RevenueMetricSchema } from '../modules/analytics/schemas/revenue-metric.schema';
import { ProductMetric, ProductMetricSchema } from '../modules/analytics/schemas/product-metric.schema';
import { UserMetric, UserMetricSchema } from '../modules/analytics/schemas/user-metric.schema';
import { SellerMetric, SellerMetricSchema } from '../modules/analytics/schemas/seller-metric.schema';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function runMigration() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const connection = app.get<Connection>(getConnectionToken());
    
    // Get or create models (check if model exists first)
    const RevenueMetricModel = connection.models[RevenueMetric.name] || 
      connection.model(RevenueMetric.name, RevenueMetricSchema);
    const ProductMetricModel = connection.models[ProductMetric.name] || 
      connection.model(ProductMetric.name, ProductMetricSchema);
    const UserMetricModel = connection.models[UserMetric.name] || 
      connection.model(UserMetric.name, UserMetricSchema);
    const SellerMetricModel = connection.models[SellerMetric.name] || 
      connection.model(SellerMetric.name, SellerMetricSchema);

    console.log('🔄 Starting analytics indexes migration...');

    // Revenue metrics indexes
    await RevenueMetricModel.collection.createIndex(
      { date: 1, period: 1 },
      { name: 'idx_revenue_date_period', background: true },
    );
    await RevenueMetricModel.collection.createIndex(
      { date: -1 },
      { name: 'idx_revenue_date_desc', background: true },
    );

    // Product metrics indexes
    await ProductMetricModel.collection.createIndex(
      { productId: 1 },
      { name: 'idx_product_productId', background: true, unique: true },
    );
    await ProductMetricModel.collection.createIndex(
      { salesCount: -1 },
      { name: 'idx_product_salesCount', background: true },
    );
    await ProductMetricModel.collection.createIndex(
      { revenue: -1 },
      { name: 'idx_product_revenue', background: true },
    );
    await ProductMetricModel.collection.createIndex(
      { sellerId: 1 },
      { name: 'idx_product_sellerId', background: true },
    );
    await ProductMetricModel.collection.createIndex(
      { category: 1 },
      { name: 'idx_product_category', background: true },
    );

    // User metrics indexes
    await UserMetricModel.collection.createIndex(
      { date: 1 },
      { name: 'idx_user_date', background: true },
    );
    await UserMetricModel.collection.createIndex(
      { date: -1 },
      { name: 'idx_user_date_desc', background: true },
    );

    // Seller metrics indexes
    await SellerMetricModel.collection.createIndex(
      { sellerId: 1 },
      { name: 'idx_seller_sellerId', background: true, unique: true },
    );
    await SellerMetricModel.collection.createIndex(
      { totalNetRevenue: -1 },
      { name: 'idx_seller_totalNetRevenue', background: true },
    );

    console.log('✅ Analytics indexes migration completed successfully');
  } catch (error) {
    console.error('❌ Error running analytics migration:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runMigration();

