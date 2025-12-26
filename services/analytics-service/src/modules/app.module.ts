import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsModule } from './analytics/analytics.module';
import { AnalyticsConsumer } from '../kafka/analytics.consumer';
import { HealthController } from '../common/health.controller';
import { CacheModule } from '../common/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.ANALYTICS_MONGO_URI || 'mongodb://mongo:27017/analytics_db', {
      maxPoolSize: parseInt(process.env.MONGO_POOL_MAX || '20', 10),
      minPoolSize: parseInt(process.env.MONGO_POOL_MIN || '5', 10),
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000', 10),
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '5000', 10),
    }),
    CacheModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [AnalyticsConsumer],
})
export class AppModule {}

