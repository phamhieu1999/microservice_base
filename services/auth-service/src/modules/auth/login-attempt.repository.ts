import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { LoginAttempt } from '../../database/entities/login-attempt.entity';

@Injectable()
export class LoginAttemptRepository {
  constructor(
    @InjectRepository(LoginAttempt)
    private readonly repo: Repository<LoginAttempt>,
  ) {}

  async create(email: string, success: boolean, ipAddress?: string): Promise<LoginAttempt> {
    const attempt = this.repo.create({ email, success, ipAddress });
    return this.repo.save(attempt);
  }

  async countRecentFailedAttempts(email: string, minutes: number = 15): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return this.repo.count({
      where: {
        email,
        success: false,
        createdAt: MoreThan(since),
      },
    });
  }

  async clearFailedAttempts(email: string) {
    await this.repo.delete({ email, success: false });
  }
}

