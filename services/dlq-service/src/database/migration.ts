import * as mongoose from 'mongoose';
import { FailedMessageSchema } from '../modules/dlq/schemas/failed-message.schema';
import { createDLQIndexes } from './indexes';

/**
 * Migration script to create indexes for DLQ collections
 */
export async function runMigration() {
  // Determine MongoDB URI
  // Priority: 1. DLQ_MONGO_URI env var, 2. Use localhost (for local development)
  // For Docker containers, set DLQ_MONGO_URI=mongodb://mongo:27017/dlq_db
  const mongoUri = process.env.DLQ_MONGO_URI || 'mongodb://localhost:27017/dlq_db';
  
  try {
    console.log(`🔄 Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const FailedMessageModel = mongoose.model('FailedMessage', FailedMessageSchema);

    console.log('🔄 Creating indexes...');
    await createDLQIndexes(FailedMessageModel);
    console.log('✅ Migration completed successfully');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

