import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MFAModule } from './auth/mfa/mfa.module';
import { DeviceModule } from './auth/device/device.module';
import { OAuthModule } from './auth/oauth/oauth.module';
import { User } from '../database/entities/user.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import { UserMFA } from '../database/entities/user-mfa.entity';
import { LoginAttempt } from '../database/entities/login-attempt.entity';
import { UserDevice } from '../database/entities/user-device.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { HealthController } from '../common/health.controller';
import { AuthConfigSchema } from '../config/config.schema';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CacheModule } from '../common/cache/cache.module';

async function validateConfig(config: Record<string, unknown>) {
  // Filter out undefined values - chỉ validate các property có giá trị thực sự
  const configWithValues = Object.fromEntries(
    Object.entries(config).filter(([_, value]) => value !== undefined && value !== '')
  );
  
  const validatedConfig = plainToClass(AuthConfigSchema, configWithValues, {
    enableImplicitConversion: true,
  });
  
  const errors = await validate(validatedConfig, {
    // Cho phép thiếu biến môi trường trong môi trường dev,
    // vì nhiều giá trị đã có default trong code (TypeORM config, v.v.).
    skipMissingProperties: true,
    whitelist: true, // Chỉ validate các property có trong schema
  });

  if (errors.length > 0) {
    throw new Error(`Configuration validation error: ${errors.toString()}`);
  }
  return validatedConfig;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfig,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.AUTH_DB_HOST || 'localhost',
        port: +(process.env.AUTH_DB_PORT || 5432),
        username: process.env.AUTH_DB_USER || 'auth_user',
        password: process.env.AUTH_DB_PASSWORD || 'auth_password',
        database: process.env.AUTH_DB_NAME || 'auth_db',
        entities: [User, RefreshToken, UserMFA, LoginAttempt, UserDevice],
        synchronize: true, // PRODUCTION: dùng migration, không để true
        // Retry connection on startup
        retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '5', 10),
        retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000', 10),
        logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        // Connection Pooling Configuration
        extra: {
          max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum pool size
          min: parseInt(process.env.DB_POOL_MIN || '5', 10),  // Minimum pool size
          idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
          connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '30000', 10), // Tăng lên 30s
        },
        poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
      }),
    }),
    CacheModule,
    KafkaModule,
    AuthModule,
    MFAModule,
    DeviceModule,
    OAuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}


