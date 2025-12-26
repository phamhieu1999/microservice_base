/**
 * MongoDB Indexes for Chat Service
 */

export const createChatIndexes = async (conversationModel: any, messageModel: any) => {
  try {
    // Compound index for buyerId and sellerId (find conversation between users)
    await conversationModel.collection.createIndex(
      { buyerId: 1, sellerId: 1 },
      { name: 'idx_conversation_buyer_seller' },
    );

    // Index for lastMessageAt (for sorting conversations)
    await conversationModel.collection.createIndex(
      { lastMessageAt: -1 },
      { name: 'idx_conversation_last_message' },
    );

    // Index for conversationId and createdAt (messages in a conversation)
    await messageModel.collection.createIndex(
      { conversationId: 1, createdAt: -1 },
      { name: 'idx_message_conversation_created' },
    );

    // Index for senderId (user's sent messages)
    await messageModel.collection.createIndex(
      { senderId: 1, createdAt: -1 },
      { name: 'idx_message_sender_created' },
    );

    console.log('✅ Chat indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating chat indexes:', error);
    throw error;
  }
};

