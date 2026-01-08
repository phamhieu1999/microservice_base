import * as mongoose from 'mongoose';
import { FailedMessage, FailedMessageSchema } from '../modules/dlq/schemas/failed-message.schema';

/**
 * Seed data for DLQ service
 */
export async function seedData() {
  // Determine MongoDB URI
  // Priority: 1. DLQ_MONGO_URI env var, 2. Use localhost (for local development)
  // For Docker containers, set DLQ_MONGO_URI=mongodb://mongo:27017/dlq_db
  const mongoUri = process.env.DLQ_MONGO_URI || 'mongodb://localhost:27017/dlq_db';
  
  try {
    console.log(`🔄 Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const FailedMessageModel = mongoose.model('FailedMessage', FailedMessageSchema);

    // Clear existing data (optional - comment out if you want to keep existing data)
    const shouldClear = process.env.CLEAR_BEFORE_SEED === 'true';
    if (shouldClear) {
      console.log('🔄 Clearing existing data...');
      await FailedMessageModel.deleteMany({});
      console.log('✅ Existing data cleared');
    }

    // Sample failed messages
    const sampleMessages = [
      {
        originalTopic: 'payment.events',
        originalPartition: 0,
        originalOffset: '1001',
        originalKey: 'payment-001',
        originalValue: {
          paymentId: 'pay-001',
          amount: 1000,
          currency: 'USD',
          userId: 'user-123',
        },
        error: 'Payment processing failed: Insufficient funds',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        retryCount: 0,
        status: 'PENDING',
      },
      {
        originalTopic: 'order.events',
        originalPartition: 1,
        originalOffset: '2002',
        originalKey: 'order-002',
        originalValue: {
          orderId: 'ord-002',
          items: [{ productId: 'prod-1', quantity: 2 }],
          total: 50.99,
        },
        error: 'Order validation failed: Invalid product ID',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        retryCount: 1,
        status: 'RETRYING',
        retriedAt: new Date(Date.now() - 1800000), // 30 minutes ago
      },
      {
        originalTopic: 'notification.events',
        originalPartition: 0,
        originalOffset: '3003',
        originalKey: 'notif-003',
        originalValue: {
          notificationId: 'notif-003',
          userId: 'user-456',
          type: 'email',
          content: 'Welcome to our service',
        },
        error: 'Notification service unavailable',
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
        retryCount: 3,
        status: 'FAILED_PERMANENT',
      },
      {
        originalTopic: 'inventory.events',
        originalPartition: 2,
        originalOffset: '4004',
        originalKey: 'inv-004',
        originalValue: {
          inventoryId: 'inv-004',
          productId: 'prod-2',
          quantity: -5,
          operation: 'decrease',
        },
        error: 'Inventory update failed: Negative quantity not allowed',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        retryCount: 0,
        status: 'PENDING',
      },
      {
        originalTopic: 'user.events',
        originalPartition: 0,
        originalOffset: '5005',
        originalKey: 'user-005',
        originalValue: {
          userId: 'user-789',
          action: 'profile_update',
          data: { name: 'John Doe', email: 'john@example.com' },
        },
        error: 'Database connection timeout',
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        retryCount: 2,
        status: 'RETRYING',
        retriedAt: new Date(Date.now() - 300000), // 5 minutes ago
      },
    ];

    console.log('🔄 Seeding data...');
    const result = await FailedMessageModel.insertMany(sampleMessages);
    console.log(`✅ Seeded ${result.length} failed messages`);

    // Display summary
    const summary = await FailedMessageModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('\n📊 Summary:');
    summary.forEach((item) => {
      console.log(`  ${item._id}: ${item.count}`);
    });

    await mongoose.disconnect();
    console.log('✅ Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run seed if called directly
if (require.main === module) {
  seedData();
}

