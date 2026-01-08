import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { SellerBalance } from '../database/entities/seller-balance.entity';
import { CommissionConfig } from '../database/entities/commission-config.entity';
import { PayoutRequest } from '../database/entities/payout-request.entity';
import { seedDatabase } from './seed';

config();

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.SETTLEMENT_DB_HOST || 'localhost',
    port: +(process.env.SETTLEMENT_DB_PORT || 5440), // Port 5440 from docker-compose mapping
    username: process.env.SETTLEMENT_DB_USER || 'settlement_user',
    password: process.env.SETTLEMENT_DB_PASSWORD || 'settlement_password',
    database: process.env.SETTLEMENT_DB_NAME || 'settlement_db',
    entities: [SellerBalance, CommissionConfig, PayoutRequest],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connected');
    await seedDatabase(dataSource);
    await dataSource.destroy();
    console.log('✅ Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runSeed();

