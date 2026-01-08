import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Dispute } from '../database/entities/dispute.entity';
import { seedDisputes } from './seed-data';
import dataSource from '../database/data-source';

dotenv.config();

async function runSeed() {
  let connection: DataSource | null = null;

  try {
    console.log('🌱 Starting seed process...');

    // Initialize data source
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log('✅ Database connection established');
    }
    connection = dataSource;

    const disputeRepository = connection.getRepository(Dispute);

    // Clear existing data (optional - comment out if you want to keep existing data)
    const existingCount = await disputeRepository.count();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing disputes. Clearing...`);
      await disputeRepository.clear();
    }

    // Insert seed data
    console.log(`📦 Inserting ${seedDisputes.length} dispute records...`);
    const disputes = disputeRepository.create(seedDisputes);
    const savedDisputes = await disputeRepository.save(disputes);

    console.log(`✅ Successfully seeded ${savedDisputes.length} disputes`);
    console.log('📊 Seed data summary:');
    const statusCounts = savedDisputes.reduce((acc, dispute) => {
      acc[dispute.status] = (acc[dispute.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(statusCounts);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    if (connection && connection.isInitialized) {
      await connection.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

runSeed();

