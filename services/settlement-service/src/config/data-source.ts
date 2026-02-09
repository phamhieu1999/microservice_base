import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { SellerBalance } from '../database/entities/seller-balance.entity';
import { CommissionConfig } from '../database/entities/commission-config.entity';
import { PayoutRequest } from '../database/entities/payout-request.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.SETTLEMENT_DB_HOST || 'localhost',
  port: +(process.env.SETTLEMENT_DB_PORT || 5440), // Port 5440 from docker-compose mapping
  username: process.env.SETTLEMENT_DB_USER || 'settlement_user',
  password: process.env.SETTLEMENT_DB_PASSWORD || 'settlement_password',
  database: process.env.SETTLEMENT_DB_NAME || 'settlement_db',
  entities: [SellerBalance, CommissionConfig, PayoutRequest],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: false,
  logging: true,
});

