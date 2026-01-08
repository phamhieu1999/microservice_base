import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Seller } from '../database/entities/seller.entity';
import { Shop } from '../database/entities/shop.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.SELLER_DB_HOST || 'localhost',
  port: +(process.env.SELLER_DB_PORT || 5436), // Port 5436 from docker-compose mapping
  username: process.env.SELLER_DB_USER || 'seller_user',
  password: process.env.SELLER_DB_PASSWORD || 'seller_password',
  database: process.env.SELLER_DB_NAME || 'seller_db',
  entities: [Seller, Shop],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: false,
  logging: true,
});

