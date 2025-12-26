import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatModule } from './chat/chat.module';
import { KafkaModule } from '../kafka/kafka.module';
import { HealthController } from '../common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.CHAT_MONGO_URI || 'mongodb://mongo:27017/chat_db', {
      maxPoolSize: parseInt(process.env.MONGO_POOL_MAX || '20', 10),
      minPoolSize: parseInt(process.env.MONGO_POOL_MIN || '5', 10),
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000', 10),
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '5000', 10),
    }),
    ChatModule,
    KafkaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}


