import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Seller } from '../database/entities/seller.entity';
import { Shop } from '../database/entities/shop.entity';
import { seedDatabase } from './seed';

config();

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.SELLER_DB_HOST || 'localhost',
    port: +(process.env.SELLER_DB_PORT || 5436), // Port 5436 from docker-compose mapping
    username: process.env.SELLER_DB_USER || 'seller_user',
    password: process.env.SELLER_DB_PASSWORD || 'seller_password',
    database: process.env.SELLER_DB_NAME || 'seller_db',
    entities: [Seller, Shop],
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

