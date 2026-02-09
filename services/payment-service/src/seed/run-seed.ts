import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Payment } from '../database/entities/payment.entity';
import { seedDatabase } from './seed';

config();

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.PAYMENT_DB_HOST || 'localhost',
    port: +(process.env.PAYMENT_DB_PORT || 5435),
    username: process.env.PAYMENT_DB_USER || 'payment_user',
    password: process.env.PAYMENT_DB_PASSWORD || 'payment_password',
    database: process.env.PAYMENT_DB_NAME || 'payment_db',
    entities: [Payment],
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

