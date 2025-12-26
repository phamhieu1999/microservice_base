import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from '../../database/entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  async createAndSave(userId: string, jti: string, rawToken: string): Promise<void> {
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const entity = this.repo.create({ userId, jti, hashedToken, revoked: false });
    await this.repo.save(entity);
  }

  async revokeToken(jti: string): Promise<void> {
    await this.repo.update({ jti }, { revoked: true });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo.update({ userId }, { revoked: true });
  }

  async validateToken(jti: string, rawToken: string): Promise<boolean> {
    const token = await this.repo.findOne({ where: { jti, revoked: false } });
    if (!token) return false;
    return bcrypt.compare(rawToken, token.hashedToken);
  }
}


