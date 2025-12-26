import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { CacheService } from '../../common/cache/cache.service';

/**
 * User-based Rate Limiting Guard
 * 
 * Limits requests per user (authenticated users) instead of per IP.
 * This prevents abuse from authenticated users and provides better
 * rate limiting for API consumers.
 */
@Injectable()
export class UserRateLimitGuard implements CanActivate {
  constructor(private readonly cache: CacheService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    // If not authenticated, skip user-based rate limiting
    // (will fall back to IP-based throttling)
    if (!userId) {
      return true;
    }

    const key = `ratelimit:user:${userId}`;
    
    try {
      // Get current count
      const count = await this.cache.get<number>(key) || 0;
      
      // Check if limit exceeded (100 req/min per user)
      if (count >= 100) {
        return false;
      }

      // Increment count
      await this.cache.set(key, count + 1, 60); // TTL: 60 seconds
      
      return true;
    } catch (error) {
      // If cache fails, allow request (fail open)
      console.error('Rate limit cache error:', error);
      return true;
    }
  }
}

