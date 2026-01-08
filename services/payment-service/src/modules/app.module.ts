import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../database/entities/payment.entity';
import { PaymentModule } from './payment/payment.module';
import { KafkaModule } from '../kafka/kafka.module';
import { HealthController } from '../common/health.controller';
import { CircuitBreakerModule } from '../common/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.PAYMENT_DB_HOST || 'localhost',
        port: +(process.env.PAYMENT_DB_PORT || 5435),
        username: process.env.PAYMENT_DB_USER || 'payment_user',
        password: process.env.PAYMENT_DB_PASSWORD || 'payment_password',
        database: process.env.PAYMENT_DB_NAME || 'payment_db',
        entities: [Payment],
        synchronize: false, // Use migrations instead of synchronize
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
    CircuitBreakerModule,
    PaymentModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}


