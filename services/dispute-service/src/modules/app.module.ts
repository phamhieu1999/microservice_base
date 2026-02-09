import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispute } from '../database/entities/dispute.entity';
import { DisputeModule } from './dispute/dispute.module';
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
        host: process.env.DISPUTE_DB_HOST || 'localhost',
        // In docker-compose: postgres-dispute uses port 5432 (container), mapped to 5439 (host)
        // When running in container: use 5432, when running from host: use 5439
        port: +(process.env.DISPUTE_DB_PORT || (process.env.DISPUTE_DB_HOST === 'postgres-dispute' ? 5432 : 5439)),
        username: process.env.DISPUTE_DB_USER || 'dispute_user',
        password: process.env.DISPUTE_DB_PASSWORD || 'dispute_password',
        database: process.env.DISPUTE_DB_NAME || 'dispute_db',
        entities: [Dispute],
        migrations: ['dist/migrations/*.js'],
        migrationsRun: process.env.RUN_MIGRATIONS === 'true',
        synchronize: process.env.NODE_ENV !== 'production' && process.env.SYNCHRONIZE === 'true',
        // Connection Pooling Configuration
        extra: {
          max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum pool size
          min: parseInt(process.env.DB_POOL_MIN || '5', 10),  // Minimum pool size
          idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
          connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '2000', 10),
        },
        poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    DisputeModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [MetricsService, TracingService, MetricsMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
