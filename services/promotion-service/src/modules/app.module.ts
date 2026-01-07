import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from '../database/entities/voucher.entity';
import { VoucherUsage } from '../database/entities/voucher-usage.entity';
import { PromotionModule } from './promotion/promotion.module';
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
        host: process.env.PROMO_DB_HOST || 'localhost',
        port: +(process.env.PROMO_DB_PORT || 5432),
        username: process.env.PROMO_DB_USER || 'promo_user',
        password: process.env.PROMO_DB_PASSWORD || 'promo_password',
        database: process.env.PROMO_DB_NAME || 'promo_db',
        entities: [Voucher, VoucherUsage],
        synchronize: false, // Tắt synchronize vì đã dùng migrations
        autoLoadEntities: true,
        retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '2', 10),
        retryDelay: parseInt(process.env.DB_RETRY_DELAY || '2000', 10),
        logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        // Don't abort on connection errors - allow app to start
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
  controllers: [HealthController, MetricsController],
  providers: [MetricsService, TracingService, MetricsMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}


