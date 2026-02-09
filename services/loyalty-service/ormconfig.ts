import { DataSource } from 'typeorm';
import { UserPoints } from './src/database/entities/user-points.entity';
import { PointTransaction } from './src/database/entities/point-transaction.entity';
import { PointTier } from './src/database/entities/point-tier.entity';
import { Referral } from './src/database/entities/referral.entity';

const dbHost = process.env.LOYALTY_DB_HOST || 'localhost';
// Use port 5438 for localhost (docker-compose host port), 5432 for container
const defaultPort = dbHost === 'localhost' || dbHost === '127.0.0.1' ? 5438 : 5432;

export default new DataSource({
  type: 'postgres',
  host: dbHost,
  port: +(process.env.LOYALTY_DB_PORT || defaultPort),
  username: process.env.LOYALTY_DB_USER || 'loyalty_user',
  password: process.env.LOYALTY_DB_PASSWORD || 'loyalty_password',
  database: process.env.LOYALTY_DB_NAME || 'loyalty_db',
  entities: [UserPoints, PointTransaction, PointTier, Referral],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

