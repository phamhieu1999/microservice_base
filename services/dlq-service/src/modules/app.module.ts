import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DLQModule } from './dlq/dlq.module';
import { HealthController } from '../common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.DLQ_MONGO_URI || 'mongodb://localhost:27017/dlq_db',
      {
        maxPoolSize: parseInt(process.env.MONGO_POOL_MAX || '20', 10),
        minPoolSize: parseInt(process.env.MONGO_POOL_MIN || '5', 10),
        socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000', 10),
        serverSelectionTimeoutMS: parseInt(
          process.env.MONGO_SERVER_SELECTION_TIMEOUT || '5000',
          10,
        ),
      },
    ),
    DLQModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

