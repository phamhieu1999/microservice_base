/**
 * MongoDB Indexes for Product Service
 * Run this script to create indexes for optimal query performance
 */

export const createProductIndexes = async (productModel: any) => {
  try {
    // Text index for full-text search
    await productModel.collection.createIndex(
      { name: 'text', description: 'text' },
      { name: 'idx_product_text_search' },
    );

    // Compound index for category and brand
    await productModel.collection.createIndex(
      { category: 1, brand: 1 },
      { name: 'idx_product_category_brand' },
    );

    // Index for seller and status
    await productModel.collection.createIndex(
      { sellerId: 1, status: 1 },
      { name: 'idx_product_seller_status', sparse: true },
    );

    // Index for createdAt (descending for recent products)
    await productModel.collection.createIndex(
      { createdAt: -1 },
      { name: 'idx_product_created_at' },
    );

    // Index for price range queries
    await productModel.collection.createIndex(
      { price: 1 },
      { name: 'idx_product_price' },
    );

    // Compound index for category, status, and createdAt
    await productModel.collection.createIndex(
      { category: 1, status: 1, createdAt: -1 },
      { name: 'idx_product_category_status_created' },
    );

    console.log('✅ Product indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating product indexes:', error);
    throw error;
  }
};

