import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchModule } from './search/search.module';
import { KafkaModule } from '../kafka/kafka.module';
import { CacheModule } from '../common/cache/cache.module';
import { HealthController } from '../common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.SEARCH_MONGO_URI || 'mongodb://localhost:27017/search_db', {
      maxPoolSize: parseInt(process.env.MONGO_POOL_MAX || '20', 10),
      minPoolSize: parseInt(process.env.MONGO_POOL_MIN || '5', 10),
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000', 10),
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '30000', 10),
      connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT || '30000', 10),
      retryWrites: true,
      retryReads: true,
    }),
    KafkaModule,
    CacheModule,
    SearchModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

