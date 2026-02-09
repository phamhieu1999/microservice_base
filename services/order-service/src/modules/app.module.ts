import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from './order/order.module';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { OrderHistory } from '../database/entities/order-history.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { HealthController } from '../common/health.controller';
import { MetricsController } from '../common/metrics.controller';
import { MetricsService } from '../common/metrics.service';
import { TracingService } from '../common/tracing.service';
import { MetricsMiddleware } from '../common/metrics.middleware';
import { TracingInterceptor } from '../common/tracing.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.ORDER_DB_HOST || 'localhost',
        port: +(process.env.ORDER_DB_PORT || 5434),
        username: process.env.ORDER_DB_USER || 'order_user',
        password: process.env.ORDER_DB_PASSWORD || 'order_password',
        database: process.env.ORDER_DB_NAME || 'order_db',
        entities: [Order, OrderItem, OrderHistory],
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
    KafkaModule,
    OrderModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    MetricsService,
    TracingService,
    MetricsMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}


