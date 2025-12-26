import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.REVIEW_MONGO_URI || 'mongodb://mongo:27017/review_db', {
      maxPoolSize: parseInt(process.env.MONGO_POOL_MAX || '20', 10),
      minPoolSize: parseInt(process.env.MONGO_POOL_MIN || '5', 10),
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000', 10),
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '5000', 10),
    }),
    ReviewModule,
  ],
})
export class AppModule {}


