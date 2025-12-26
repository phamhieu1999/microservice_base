/**
 * MongoDB Indexes for Notification Service
 */

export const createNotificationIndexes = async (notificationModel: any) => {
  try {
    // Compound index for userId, read status, and createdAt (most common query)
    await notificationModel.collection.createIndex(
      { userId: 1, read: 1, createdAt: -1 },
      { name: 'idx_notification_user_read_created' },
    );

    // Index for userId and type (filter by notification type)
    await notificationModel.collection.createIndex(
      { userId: 1, type: 1 },
      { name: 'idx_notification_user_type' },
    );

    // Index for createdAt (for cleanup of old notifications)
    await notificationModel.collection.createIndex(
      { createdAt: -1 },
      { name: 'idx_notification_created_at' },
    );

    // Index for userId only (for counting unread)
    await notificationModel.collection.createIndex(
      { userId: 1 },
      { name: 'idx_notification_user_id' },
    );

    console.log('✅ Notification indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating notification indexes:', error);
    throw error;
  }
};

