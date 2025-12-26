/**
 * MongoDB Indexes for Review Service
 */

export const createReviewIndexes = async (reviewModel: any) => {
  try {
    // Compound index for productId and rating (for sorting by rating)
    await reviewModel.collection.createIndex(
      { productId: 1, rating: -1 },
      { name: 'idx_review_product_rating' },
    );

    // Index for userId and createdAt (user's review history)
    await reviewModel.collection.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'idx_review_user_created' },
    );

    // Index for productId and createdAt (recent reviews for a product)
    await reviewModel.collection.createIndex(
      { productId: 1, createdAt: -1 },
      { name: 'idx_review_product_created' },
    );

    // Index for rating (for filtering by rating)
    await reviewModel.collection.createIndex(
      { rating: 1 },
      { name: 'idx_review_rating' },
    );

    console.log('✅ Review indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating review indexes:', error);
    throw error;
  }
};

