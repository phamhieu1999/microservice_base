import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from './cart/cart.module';
import { CacheModule } from '../common/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        // Hỗ trợ cả localhost và docker environment
        const defaultUri = process.env.NODE_ENV === 'production' 
          ? 'mongodb://mongo:27017/cart_db'
          : 'mongodb://localhost:27017/cart_db';
        
        return {
          uri: process.env.CART_MONGO_URI || defaultUri,
          maxPoolSize: parseInt(process.env.MONGO_POOL_MAX || '20', 10),
          minPoolSize: parseInt(process.env.MONGO_POOL_MIN || '5', 10),
          socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000', 10),
          serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '30000', 10),
          retryWrites: true,
          retryReads: true,
          connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT || '30000', 10),
          heartbeatFrequencyMS: 10000,
        };
      },
    }),
    CacheModule,
    CartModule,
  ],
})
export class AppModule {}


