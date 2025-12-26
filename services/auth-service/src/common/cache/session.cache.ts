import { Injectable, Optional } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class SessionCacheService {
  constructor(@Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache) {}

  async cacheUserSession(userId: string, userData: any, ttl = 3600): Promise<void> {
    if (!this.cacheManager) return;
    await this.cacheManager.set(`session:${userId}`, userData, ttl);
  }

  async getUserSession(userId: string): Promise<any | undefined> {
    if (!this.cacheManager) return undefined;
    return this.cacheManager.get(`session:${userId}`);
  }

  async invalidateUserSession(userId: string): Promise<void> {
    if (!this.cacheManager) return;
    await this.cacheManager.del(`session:${userId}`);
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    if (!this.cacheManager) return;
    // Invalidate all sessions for this user (e.g., on password change)
    await this.cacheManager.del(`session:${userId}`);
  }
}

