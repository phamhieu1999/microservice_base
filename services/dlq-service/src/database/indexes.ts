/**
 * MongoDB Indexes for DLQ Service
 */

export const createDLQIndexes = async (failedMessageModel: any) => {
  try {
    // Index for originalTopic and status (for filtering failed messages)
    await failedMessageModel.collection.createIndex(
      { originalTopic: 1, status: 1 },
      { name: 'idx_dlq_topic_status' },
    );

    // Index for timestamp (for sorting and cleanup of old messages)
    await failedMessageModel.collection.createIndex(
      { timestamp: -1 },
      { name: 'idx_dlq_timestamp' },
    );

    // Index for createdAt (for cleanup of old messages)
    await failedMessageModel.collection.createIndex(
      { createdAt: -1 },
      { name: 'idx_dlq_created_at' },
    );

    // Index for retryCount and status (for finding messages ready to retry)
    await failedMessageModel.collection.createIndex(
      { retryCount: 1, status: 1 },
      { name: 'idx_dlq_retry_status' },
    );

    // Index for status (for filtering by status)
    await failedMessageModel.collection.createIndex(
      { status: 1 },
      { name: 'idx_dlq_status' },
    );

    console.log('✅ DLQ indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating DLQ indexes:', error);
    throw error;
  }
};

