import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async createUser(data: Partial<User>): Promise<User> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async lockAccount(email: string, lockMinutes: number): Promise<void> {
    const lockedUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
    await this.repo.update({ email }, { isLocked: true, lockedUntil });
  }

  async unlockAccount(email: string): Promise<void> {
    await this.repo.update({ email }, { isLocked: false, lockedUntil: null });
  }

  async isAccountLocked(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user || !user.isLocked) return false;

    // Check if lock has expired
    if (user.lockedUntil && user.lockedUntil < new Date()) {
      await this.unlockAccount(email);
      return false;
    }

    return true;
  }
}


