import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { User } from '../../database/entities/user.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { LoginAttempt } from '../../database/entities/login-attempt.entity';
import { RefreshTokenRepository } from './refresh-token.repository';
import { LoginAttemptRepository } from './login-attempt.repository';
import { RegisterUserUseCase } from '../../application/auth/use-cases/register-user.usecase';
import { LoginUserUseCase } from '../../application/auth/use-cases/login-user.usecase';
import { RefreshTokenUseCase } from '../../application/auth/use-cases/refresh-token.usecase';
import { LogoutUseCase } from '../../application/auth/use-cases/logout.usecase';
import { DeviceModule } from './device/device.module';
import { SessionCacheService } from '../../common/cache/session.cache';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, LoginAttempt]),
    PassportModule,
    JwtModule.register({}),
    DeviceModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    RefreshTokenRepository,
    LoginAttemptRepository,
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    SessionCacheService,
    JwtStrategy,
  ],
})
export class AuthModule {}


