import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { Notification, NotificationSchema } from '../modules/notification/schemas/notification.schema';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function runMigration() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const connection = app.get<Connection>(getConnectionToken());
    
    // Get or create Notification model
    const NotificationModel = connection.models[Notification.name] || 
      connection.model(Notification.name, NotificationSchema);

    console.log('🔄 Starting notification indexes migration...');

    // Compound index for userId, read status, and createdAt (most common query)
    try {
      await NotificationModel.collection.createIndex(
        { userId: 1, read: 1, createdAt: -1 },
        { name: 'idx_notification_user_read_created', background: true },
      );
      console.log('✅ Created userId_read_createdAt compound index');
    } catch (error: any) {
      if (error.code !== 85) { // 85 = IndexOptionsConflict
        console.warn('⚠️  userId_read_createdAt index already exists or error:', error.message);
      }
    }

    // Index for userId and type (filter by notification type)
    try {
      await NotificationModel.collection.createIndex(
        { userId: 1, type: 1 },
        { name: 'idx_notification_user_type', background: true },
      );
      console.log('✅ Created userId_type compound index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  userId_type index already exists or error:', error.message);
      }
    }

    // Index for createdAt (for cleanup of old notifications)
    try {
      await NotificationModel.collection.createIndex(
        { createdAt: -1 },
        { name: 'idx_notification_created_at', background: true },
      );
      console.log('✅ Created createdAt index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  createdAt index already exists or error:', error.message);
      }
    }

    // Index for userId only (for counting unread)
    try {
      await NotificationModel.collection.createIndex(
        { userId: 1 },
        { name: 'idx_notification_user_id', background: true },
      );
      console.log('✅ Created userId index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  userId index already exists or error:', error.message);
      }
    }

    console.log('✅ Notification indexes migration completed successfully');
  } catch (error) {
    console.error('❌ Error running notification migration:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runMigration();

