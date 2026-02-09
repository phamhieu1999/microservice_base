import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { UserPoints } from '../database/entities/user-points.entity';
import { PointTransaction } from '../database/entities/point-transaction.entity';
import { PointTier } from '../database/entities/point-tier.entity';
import { Referral } from '../database/entities/referral.entity';
import { seedDatabase } from './seed';

config();

async function runSeed() {
  const dbHost = process.env.LOYALTY_DB_HOST || 'localhost';
  // Use port 5438 for localhost (docker-compose host port), 5432 for container
  const defaultPort = dbHost === 'localhost' || dbHost === '127.0.0.1' ? 5438 : 5432;
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: dbHost,
    port: +(process.env.LOYALTY_DB_PORT || defaultPort),
    username: process.env.LOYALTY_DB_USER || 'loyalty_user',
    password: process.env.LOYALTY_DB_PASSWORD || 'loyalty_password',
    database: process.env.LOYALTY_DB_NAME || 'loyalty_db',
    entities: [UserPoints, PointTransaction, PointTier, Referral],
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

