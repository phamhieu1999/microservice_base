import { DataSource } from 'typeorm';
import { Payment } from './src/database/entities/payment.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.PAYMENT_DB_HOST || 'localhost',
  port: +(process.env.PAYMENT_DB_PORT || 5435),
  username: process.env.PAYMENT_DB_USER || 'payment_user',
  password: process.env.PAYMENT_DB_PASSWORD || 'payment_password',
  database: process.env.PAYMENT_DB_NAME || 'payment_db',
  entities: [Payment],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

