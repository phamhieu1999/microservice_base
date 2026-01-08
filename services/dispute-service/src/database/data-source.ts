import { DataSource, DataSourceOptions } from 'typeorm';
import { Dispute } from './entities/dispute.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DISPUTE_DB_HOST || 'localhost',
  // Port 5439 is the host port mapped from container port 5432 in docker-compose.yml
  port: +(process.env.DISPUTE_DB_PORT || 5439),
  username: process.env.DISPUTE_DB_USER || 'dispute_user',
  password: process.env.DISPUTE_DB_PASSWORD || 'dispute_password',
  database: process.env.DISPUTE_DB_NAME || 'dispute_db',
  entities: [Dispute],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;

