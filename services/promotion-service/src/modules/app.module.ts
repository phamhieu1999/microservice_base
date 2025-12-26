import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from '../database/entities/voucher.entity';
import { VoucherUsage } from '../database/entities/voucher-usage.entity';
import { PromotionModule } from './promotion/promotion.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.PROMO_DB_HOST || 'localhost',
        port: +(process.env.PROMO_DB_PORT || 5432),
        username: process.env.PROMO_DB_USER || 'promo_user',
        password: process.env.PROMO_DB_PASSWORD || 'promo_password',
        database: process.env.PROMO_DB_NAME || 'promo_db',
        entities: [Voucher, VoucherUsage],
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
    PromotionModule,
  ],
})
export class AppModule {}


