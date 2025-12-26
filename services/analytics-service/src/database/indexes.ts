/**
 * MongoDB Indexes for Analytics Service
 */

export const createAnalyticsIndexes = async (
  revenueMetricModel: any,
  productMetricModel: any,
  userMetricModel: any,
  sellerMetricModel: any,
) => {
  try {
    // Revenue metrics indexes
    await revenueMetricModel.collection.createIndex(
      { date: -1 },
      { name: 'idx_revenue_date' },
    );
    await revenueMetricModel.collection.createIndex(
      { date: 1, metric: 1 },
      { name: 'idx_revenue_date_metric' },
    );

    // Product metrics indexes
    await productMetricModel.collection.createIndex(
      { productId: 1, date: -1 },
      { name: 'idx_product_metric_product_date' },
    );
    await productMetricModel.collection.createIndex(
      { sales: -1 },
      { name: 'idx_product_metric_sales' },
    );

    // User metrics indexes
    await userMetricModel.collection.createIndex(
      { date: -1 },
      { name: 'idx_user_metric_date' },
    );
    await userMetricModel.collection.createIndex(
      { date: 1, metric: 1 },
      { name: 'idx_user_metric_date_metric' },
    );

    // Seller metrics indexes
    if (sellerMetricModel) {
      await sellerMetricModel.collection.createIndex(
        { sellerId: 1, date: -1 },
        { name: 'idx_seller_metric_seller_date' },
      );
      await sellerMetricModel.collection.createIndex(
        { netRevenue: -1 },
        { name: 'idx_seller_metric_net_revenue' },
      );
    }

    console.log('✅ Analytics indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating analytics indexes:', error);
    throw error;
  }
};

