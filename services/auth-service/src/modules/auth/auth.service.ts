import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { KafkaService } from '../../kafka/kafka.service';
import { USER_CREATED_TOPIC, UserCreatedEvent } from './events/user-created.event';
import { RefreshTokenRepository } from './refresh-token.repository';
import { LoginAttemptRepository } from './login-attempt.repository';
import { DeviceService } from './device/device.service';
import { randomUUID } from 'crypto';
import { SessionCacheService } from '../../common/cache/session.cache';

@Injectable()
export class AuthService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 30;

  constructor(
    private readonly repo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly kafka: KafkaService,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly loginAttemptRepo: LoginAttemptRepository,
    private readonly deviceService?: DeviceService,
    private readonly sessionCache?: SessionCacheService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.repo.createUser({
      email: dto.email,
      passwordHash,
      role: 'USER',
    });

    const event: UserCreatedEvent = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
    await this.kafka.emit(USER_CREATED_TOPIC, event);

    const tokens = await this.generateAndStoreTokens(user.id, user.email, user.role);
    const userData = { id: user.id, email: user.email, role: user.role };
    
    // Cache user session
    if (this.sessionCache) {
      await this.sessionCache.cacheUserSession(user.id, userData, 3600);
    }
    
    return { user: userData, ...tokens };
  }

  async login(dto: LoginDto, ipAddress?: string, deviceId?: string, userAgent?: string) {
    // Check if account is locked
    const isLocked = await this.repo.isAccountLocked(dto.email);
    if (isLocked) {
      throw new ForbiddenException('Account is locked due to too many failed login attempts. Please try again later.');
    }

    const user = await this.repo.findByEmail(dto.email);
    if (!user) {
      // Track failed attempt
      await this.loginAttemptRepo.create(dto.email, false, ipAddress);
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) {
      // Track failed attempt
      await this.loginAttemptRepo.create(dto.email, false, ipAddress);

      // Check failed attempts and lock if needed
      const failedAttempts = await this.loginAttemptRepo.countRecentFailedAttempts(
        dto.email,
        15, // Last 15 minutes
      );

      if (failedAttempts >= this.MAX_FAILED_ATTEMPTS - 1) {
        // -1 because we just added one
        await this.repo.lockAccount(dto.email, this.LOCK_DURATION_MINUTES);
        throw new ForbiddenException(
          `Account locked due to too many failed attempts. Please try again after ${this.LOCK_DURATION_MINUTES} minutes.`,
        );
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    // Login successful - clear failed attempts and track success
    await this.loginAttemptRepo.clearFailedAttempts(dto.email);
    await this.loginAttemptRepo.create(dto.email, true, ipAddress);

    // Track device
    if (this.deviceService && deviceId) {
      await this.deviceService.trackDevice(user.id, deviceId, undefined, userAgent, ipAddress);
    }

    const tokens = await this.generateAndStoreTokens(user.id, user.email, user.role);
    const userData = { id: user.id, email: user.email, role: user.role };
    
    // Cache user session
    if (this.sessionCache) {
      await this.sessionCache.cacheUserSession(user.id, userData, 3600);
    }
    
    return { user: userData, ...tokens };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      }) as { sub: string; email: string; role: string; jti: string };

      const isValid = await this.refreshTokenRepo.validateToken(payload.jti, refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // rotate: revoke old and issue new
      await this.refreshTokenRepo.revokeToken(payload.jti);
      const tokens = await this.generateAndStoreTokens(payload.sub, payload.email, payload.role);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateAndStoreTokens(userId: string, email: string, role: string) {
    const jti = randomUUID();
    const payload = { sub: userId, email, role };
    const refreshPayload = { ...payload, jti };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'access-secret',
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      expiresIn: '7d',
    });

    await this.refreshTokenRepo.createAndSave(userId, jti, refreshToken);

    return { accessToken, refreshToken };
  }
}


