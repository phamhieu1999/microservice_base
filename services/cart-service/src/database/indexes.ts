/**
 * MongoDB Indexes for Cart Service
 */

export const createCartIndexes = async (cartModel: any) => {
  try {
    // Get existing indexes
    const existingIndexes = await cartModel.collection.indexes();
    const existingIndexNames = existingIndexes.map((idx: any) => idx.name);

    // Drop existing userId index if it exists with different name
    const userIdIndex = existingIndexes.find(
      (idx: any) => idx.key && idx.key.userId,
    );
    if (userIdIndex && userIdIndex.name !== 'idx_cart_user_id_unique') {
      console.log(`🗑️  Dropping existing userId index: ${userIdIndex.name}`);
      await cartModel.collection.dropIndex(userIdIndex.name);
    }

    // Create unique index for userId (one cart per user)
    if (!existingIndexNames.includes('idx_cart_user_id_unique')) {
      await cartModel.collection.createIndex(
        { userId: 1 },
        { unique: true, name: 'idx_cart_user_id_unique' },
      );
      console.log('✅ Created index: idx_cart_user_id_unique');
    } else {
      console.log('ℹ️  Index idx_cart_user_id_unique already exists');
    }

    // Create index for updatedAt (for cleanup of old carts)
    if (!existingIndexNames.includes('idx_cart_updated_at')) {
      await cartModel.collection.createIndex(
        { updatedAt: -1 },
        { name: 'idx_cart_updated_at' },
      );
      console.log('✅ Created index: idx_cart_updated_at');
    } else {
      console.log('ℹ️  Index idx_cart_updated_at already exists');
    }

    console.log('✅ Cart indexes migration completed successfully');
  } catch (error) {
    console.error('❌ Error creating cart indexes:', error);
    throw error;
  }
};

