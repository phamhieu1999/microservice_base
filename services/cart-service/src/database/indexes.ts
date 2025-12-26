/**
 * MongoDB Indexes for Cart Service
 */

export const createCartIndexes = async (cartModel: any) => {
  try {
    // Unique index for userId (one cart per user)
    await cartModel.collection.createIndex(
      { userId: 1 },
      { unique: true, name: 'idx_cart_user_id_unique' },
    );

    // Index for updatedAt (for cleanup of old carts)
    await cartModel.collection.createIndex(
      { updatedAt: -1 },
      { name: 'idx_cart_updated_at' },
    );

    console.log('✅ Cart indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating cart indexes:', error);
    throw error;
  }
};

