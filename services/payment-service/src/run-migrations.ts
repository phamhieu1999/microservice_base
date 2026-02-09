import { DataSource } from 'typeorm';
import { CreatePaymentsTable1700000000001 } from './migrations/1700000000001-CreatePaymentsTable';
import { AddPaymentIndexes1700000000002 } from './migrations/1700000000002-AddPaymentIndexes';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.PAYMENT_DB_HOST || 'localhost',
  port: +(process.env.PAYMENT_DB_PORT || 5435),
  username: process.env.PAYMENT_DB_USER || 'payment_user',
  password: process.env.PAYMENT_DB_PASSWORD || 'payment_password',
  database: process.env.PAYMENT_DB_NAME || 'payment_db',
  entities: [],
  migrations: [],
  synchronize: false,
});

async function runMigrations() {
  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Check if payments table exists
    const tableExists = await queryRunner.hasTable('payments');
    
    if (!tableExists) {
      console.log('📦 Running migrations...');
      const migration1 = new CreatePaymentsTable1700000000001();
      await migration1.up(queryRunner);
      console.log('✅ Created payments table');

      const migration2 = new AddPaymentIndexes1700000000002();
      await migration2.up(queryRunner);
      console.log('✅ Created indexes');
    } else {
      console.log('✅ Payments table already exists, skipping migrations');
    }

    await queryRunner.release();
    await dataSource.destroy();
    console.log('✅ Migrations completed');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigrations();

