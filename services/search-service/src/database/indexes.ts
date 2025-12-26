/**
 * MongoDB Indexes for Search Service
 */

export const createSearchIndexes = async (productIndexModel: any) => {
  try {
    // Text index for search
    await productIndexModel.collection.createIndex(
      { name: 'text', searchText: 'text' },
      { name: 'idx_search_text' },
    );

    // Index for category
    await productIndexModel.collection.createIndex(
      { category: 1 },
      { name: 'idx_search_category' },
    );

    // Index for brand
    await productIndexModel.collection.createIndex(
      { brand: 1 },
      { name: 'idx_search_brand' },
    );

    // Compound index for category and brand
    await productIndexModel.collection.createIndex(
      { category: 1, brand: 1 },
      { name: 'idx_search_category_brand' },
    );

    // Index for sellerId
    await productIndexModel.collection.createIndex(
      { sellerId: 1 },
      { name: 'idx_search_seller_id', sparse: true },
    );

    // Index for createdAt (for recent products)
    await productIndexModel.collection.createIndex(
      { createdAt: -1 },
      { name: 'idx_search_created_at' },
    );

    console.log('✅ Search indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating search indexes:', error);
    throw error;
  }
};

