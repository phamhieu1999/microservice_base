import * as mongoose from 'mongoose';
import { RevenueMetricSchema } from '../modules/analytics/schemas/revenue-metric.schema';
import { ProductMetricSchema } from '../modules/analytics/schemas/product-metric.schema';
import { UserMetricSchema } from '../modules/analytics/schemas/user-metric.schema';
import { SellerMetricSchema } from '../modules/analytics/schemas/seller-metric.schema';
import { createAnalyticsIndexes } from './indexes';

/**
 * Migration script to create indexes for Analytics collections
 */
export async function runMigration() {
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

    console.log('🔄 Creating indexes...');
    await createAnalyticsIndexes(
      RevenueMetricModel,
      ProductMetricModel,
      UserMetricModel,
      SellerMetricModel,
    );
    console.log('✅ Migration completed successfully');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

