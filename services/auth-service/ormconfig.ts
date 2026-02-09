import { DataSource } from 'typeorm';
import { User } from './src/database/entities/user.entity';
import { RefreshToken } from './src/database/entities/refresh-token.entity';
import { UserMFA } from './src/database/entities/user-mfa.entity';
import { LoginAttempt } from './src/database/entities/login-attempt.entity';
import { UserDevice } from './src/database/entities/user-device.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.AUTH_DB_HOST || 'localhost',
  port: +(process.env.AUTH_DB_PORT || 5433),
  username: process.env.AUTH_DB_USER || 'auth_user',
  password: process.env.AUTH_DB_PASSWORD || 'auth_password',
  database: process.env.AUTH_DB_NAME || 'auth_db',
  entities: [User, RefreshToken, UserMFA, LoginAttempt, UserDevice],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

