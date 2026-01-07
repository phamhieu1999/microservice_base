import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Voucher } from './src/database/entities/voucher.entity';
import { VoucherUsage } from './src/database/entities/voucher-usage.entity';

// Load environment variables from .env file
config();

// Auto-detect if running from host (Docker container) or inside Docker
// If DB_HOST is 'postgres-promo', we're inside Docker network
// Otherwise, use localhost with port 5437 (Docker mapped port)
const isDockerNetwork = process.env.PROMO_DB_HOST === 'postgres-promo' || 
                        process.env.PROMO_DB_HOST?.includes('postgres-promo');

const defaultHost = isDockerNetwork ? 'postgres-promo' : 'localhost';
const defaultPort = isDockerNetwork ? 5432 : 5437;

export default new DataSource({
  type: 'postgres',
  host: process.env.PROMO_DB_HOST || defaultHost,
  port: +(process.env.PROMO_DB_PORT || defaultPort),
  username: process.env.PROMO_DB_USER || 'promo_user',
  password: process.env.PROMO_DB_PASSWORD || 'promo_password',
  database: process.env.PROMO_DB_NAME || 'promo_db',
  entities: [Voucher, VoucherUsage],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

