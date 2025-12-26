import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerModule } from './seller/seller.module';
import { Seller } from '../database/entities/seller.entity';
import { Shop } from '../database/entities/shop.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.SELLER_DB_HOST || 'localhost',
        port: +(process.env.SELLER_DB_PORT || 5432),
        username: process.env.SELLER_DB_USER || 'seller_user',
        password: process.env.SELLER_DB_PASSWORD || 'seller_password',
        database: process.env.SELLER_DB_NAME || 'seller_db',
        entities: [Seller, Shop],
        synchronize: true,
        // Connection Pooling Configuration
        extra: {
          max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum pool size
          min: parseInt(process.env.DB_POOL_MIN || '5', 10),  // Minimum pool size
          idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
          connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '2000', 10),
        },
        poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
      }),
    }),
    SellerModule,
  ],
})
export class AppModule {}


