import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerBalance } from '../database/entities/seller-balance.entity';
import { CommissionConfig } from '../database/entities/commission-config.entity';
import { PayoutRequest } from '../database/entities/payout-request.entity';
import { SettlementModule } from './settlement/settlement.module';
import { HealthController } from '../common/health.controller';
import { MetricsController } from '../common/metrics.controller';
import { MetricsService } from '../common/metrics.service';
import { TracingService } from '../common/tracing.service';
import { MetricsMiddleware } from '../common/metrics.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.SETTLEMENT_DB_HOST || 'localhost',
        port: +(process.env.SETTLEMENT_DB_PORT || 5432),
        username: process.env.SETTLEMENT_DB_USER || 'settlement_user',
        password: process.env.SETTLEMENT_DB_PASSWORD || 'settlement_password',
        database: process.env.SETTLEMENT_DB_NAME || 'settlement_db',
        entities: [SellerBalance, CommissionConfig, PayoutRequest],
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
    SettlementModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [MetricsService, TracingService, MetricsMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
