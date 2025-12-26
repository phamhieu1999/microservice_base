import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  // OAuth login/register
  async handleOAuthCallback(provider: 'google' | 'facebook', profile: any) {
    const oauthId = profile.id;
    const email = profile.emails?.[0]?.value || profile.email;

    if (!email) {
      throw new Error('Email not provided by OAuth provider');
    }

    // Tìm user theo OAuth ID hoặc email
    let user = await this.userRepo.findOne({
      where: [{ oauthId, oauthProvider: provider }, { email }],
    });

    if (!user) {
      // Tạo user mới
      user = await this.userRepo.save({
        email,
        passwordHash: '', // OAuth users không có password
        role: 'USER',
        emailVerified: true, // OAuth emails đã verified
        oauthProvider: provider,
        oauthId,
      });
    } else {
      // Link OAuth account với existing user
      if (!user.oauthProvider) {
        user.oauthProvider = provider;
        user.oauthId = oauthId;
        await this.userRepo.save(user);
      }
    }

    // Generate tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'access-secret',
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(
      { ...payload, jti: Date.now().toString() },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        expiresIn: '7d',
      },
    );

    return {
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    };
  }
}

