import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingModule } from './shipping/shipping.module';
import { ShippingMethod } from '../database/entities/shipping-method.entity';
import { ShippingQuote } from '../database/entities/shipping-quote.entity';
import { ShippingOrder } from '../database/entities/shipping-order.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        // Support both SHIPPING_DB_* and legacy DB_* environment variables
        const host = process.env.SHIPPING_DB_HOST || process.env.DB_HOST || 'localhost';
        const isLocal = host === 'localhost';
        
        // When running locally (localhost), always use port 5441 (docker-compose mapping)
        // When running in container, use env variables (postgres-shipping:5432)
        // Only use explicit SHIPPING_DB_PORT if set, otherwise auto-detect based on host
        let port: number;
        if (process.env.SHIPPING_DB_PORT) {
          port = +process.env.SHIPPING_DB_PORT;
        } else if (isLocal) {
          // Local development: use docker-compose mapped port
          port = 5441;
        } else {
          // Container: use default or DB_PORT from env
          port = +(process.env.DB_PORT || 5432);
        }
        
        const username = process.env.SHIPPING_DB_USER || process.env.DB_USERNAME || 'shipping_user';
        const password = process.env.SHIPPING_DB_PASSWORD || process.env.DB_PASSWORD || 'shipping_password';
        const database = process.env.SHIPPING_DB_NAME || process.env.DB_DATABASE || 'shipping_db';
        
        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [ShippingMethod, ShippingQuote, ShippingOrder],
          migrations: ['dist/migrations/**/*.js'],
          synchronize: false,
          migrationsRun: false,
          // Connection Pooling Configuration
          extra: {
            max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum pool size
            min: parseInt(process.env.DB_POOL_MIN || '5', 10),  // Minimum pool size
            idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
            connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '2000', 10),
          },
          poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
        };
      },
    }),
    ShippingModule,
  ],
})
export class AppModule {}


