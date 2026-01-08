/**
 * MongoDB Indexes for Analytics Service
 */

/**
 * Helper function to create index safely (skip if already exists)
 */
async function createIndexSafely(
  collection: any,
  indexSpec: any,
  options: any,
): Promise<void> {
  try {
    await collection.createIndex(indexSpec, options);
    console.log(`  ✓ Created index: ${options.name || JSON.stringify(indexSpec)}`);
  } catch (error: any) {
    // If index already exists, that's okay
    if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
      console.log(`  ⊙ Index already exists: ${options.name || JSON.stringify(indexSpec)}`);
    } else if (error.code === 86 || error.codeName === 'IndexKeySpecsConflict') {
      // Index with same key but different name exists - try to drop and recreate
      console.log(`  ⚠ Index conflict detected: ${options.name || JSON.stringify(indexSpec)}`);
      console.log(`  → Attempting to drop existing index and recreate...`);
      try {
        // Get existing indexes
        const existingIndexes = await collection.listIndexes().toArray();
        const existingIndex = existingIndexes.find(
          (idx: any) => JSON.stringify(idx.key) === JSON.stringify(indexSpec),
        );
        if (existingIndex) {
          await collection.dropIndex(existingIndex.name);
          console.log(`  → Dropped existing index: ${existingIndex.name}`);
          await collection.createIndex(indexSpec, options);
          console.log(`  ✓ Recreated index: ${options.name || JSON.stringify(indexSpec)}`);
        }
      } catch (dropError: any) {
        console.log(`  ⊙ Could not recreate index, skipping: ${dropError.message}`);
      }
    } else {
      throw error;
    }
  }
}

export const createAnalyticsIndexes = async (
  revenueMetricModel: any,
  productMetricModel: any,
  userMetricModel: any,
  sellerMetricModel: any,
) => {
  try {
    console.log('🔄 Creating indexes...');

    // Revenue metrics indexes
    await createIndexSafely(
      revenueMetricModel.collection,
      { date: -1 },
      { name: 'idx_revenue_date_desc', background: true },
    );
    await createIndexSafely(
      revenueMetricModel.collection,
      { date: 1, period: 1 },
      { name: 'idx_revenue_date_period', background: true },
    );

    // Product metrics indexes
    await createIndexSafely(
      productMetricModel.collection,
      { productId: 1 },
      { name: 'idx_product_productId', background: true, unique: true },
    );
    await createIndexSafely(
      productMetricModel.collection,
      { salesCount: -1 },
      { name: 'idx_product_salesCount', background: true },
    );
    await createIndexSafely(
      productMetricModel.collection,
      { revenue: -1 },
      { name: 'idx_product_revenue', background: true },
    );
    await createIndexSafely(
      productMetricModel.collection,
      { sellerId: 1 },
      { name: 'idx_product_sellerId', background: true },
    );
    await createIndexSafely(
      productMetricModel.collection,
      { category: 1 },
      { name: 'idx_product_category', background: true },
    );

    // User metrics indexes
    await createIndexSafely(
      userMetricModel.collection,
      { date: 1 },
      { name: 'idx_user_date', background: true },
    );
    await createIndexSafely(
      userMetricModel.collection,
      { date: -1 },
      { name: 'idx_user_date_desc', background: true },
    );

    // Seller metrics indexes
    if (sellerMetricModel) {
      await createIndexSafely(
        sellerMetricModel.collection,
        { sellerId: 1 },
        { name: 'idx_seller_sellerId', background: true, unique: true },
      );
      await createIndexSafely(
        sellerMetricModel.collection,
        { totalNetRevenue: -1 },
        { name: 'idx_seller_totalNetRevenue', background: true },
      );
    }

    console.log('✅ Analytics indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating analytics indexes:', error);
    throw error;
  }
};

