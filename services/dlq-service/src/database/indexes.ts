/**
 * MongoDB Indexes for DLQ Service
 */

export const createDLQIndexes = async (failedMessageModel: any) => {
  try {
    // Index for topic and status (for filtering failed messages)
    await failedMessageModel.collection.createIndex(
      { topic: 1, status: 1 },
      { name: 'idx_dlq_topic_status' },
    );

    // Index for createdAt (for cleanup of old messages)
    await failedMessageModel.collection.createIndex(
      { createdAt: -1 },
      { name: 'idx_dlq_created_at' },
    );

    // Index for retryCount (for finding messages ready to retry)
    await failedMessageModel.collection.createIndex(
      { retryCount: 1, status: 1 },
      { name: 'idx_dlq_retry_status' },
    );

    // Index for originalMessageId (for deduplication)
    await failedMessageModel.collection.createIndex(
      { originalMessageId: 1 },
      { name: 'idx_dlq_original_message_id', sparse: true },
    );

    console.log('✅ DLQ indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating DLQ indexes:', error);
    throw error;
  }
};

