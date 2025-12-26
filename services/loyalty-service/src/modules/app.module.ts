import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { UserPoints } from '../database/entities/user-points.entity';
import { PointTransaction } from '../database/entities/point-transaction.entity';
import { PointTier } from '../database/entities/point-tier.entity';
import { Referral } from '../database/entities/referral.entity';
import { HealthController } from '../common/health.controller';
import { PaymentEventsConsumer } from '../kafka/payment.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.LOYALTY_DB_HOST || 'localhost',
        port: +(process.env.LOYALTY_DB_PORT || 5432),
        username: process.env.LOYALTY_DB_USER || 'loyalty_user',
        password: process.env.LOYALTY_DB_PASSWORD || 'loyalty_password',
        database: process.env.LOYALTY_DB_NAME || 'loyalty_db',
        entities: [UserPoints, PointTransaction, PointTier, Referral],
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
    LoyaltyModule,
  ],
  controllers: [HealthController],
  providers: [PaymentEventsConsumer],
})
export class AppModule {}
