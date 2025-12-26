import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // chỉ để Passport dùng, verify bằng secret trong strategy
  ],
  providers: [
    JwtStrategy,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [JwtStrategy],
})
export class AuthModule {}


