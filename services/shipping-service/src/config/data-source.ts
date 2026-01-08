import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { ShippingMethod } from '../database/entities/shipping-method.entity';
import { ShippingQuote } from '../database/entities/shipping-quote.entity';
import { ShippingOrder } from '../database/entities/shipping-order.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.SHIPPING_DB_HOST || 'localhost',
  port: +(process.env.SHIPPING_DB_PORT || 5441), // Port 5441 from docker-compose mapping
  username: process.env.SHIPPING_DB_USER || 'shipping_user',
  password: process.env.SHIPPING_DB_PASSWORD || 'shipping_password',
  database: process.env.SHIPPING_DB_NAME || 'shipping_db',
  entities: [ShippingMethod, ShippingQuote, ShippingOrder],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: false,
  logging: true,
});

