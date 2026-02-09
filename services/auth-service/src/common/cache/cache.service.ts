import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.cacheManager.get<T>(key);
    // cache-manager can return null when the key does not exist
    return value === null ? undefined : value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    // Not all cache-manager stores implement reset in the typings,
    // so we guard and cast to avoid type errors while still supporting stores that do.
    const cache: any = this.cacheManager as any;
    if (typeof cache.reset === 'function') {
      await cache.reset();
    }
  }

  /**
   * Get or set pattern - get from cache, or compute and cache
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate cache by pattern (prefix)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // Note: This is a simplified version. In production, use Redis SCAN for pattern matching
    // For now, we'll use a simple prefix-based approach
    const keys = await this.getAllKeys();
    const matchingKeys = keys.filter((key) => key.startsWith(pattern));
    await Promise.all(matchingKeys.map((key) => this.del(key)));
  }

  private async getAllKeys(): Promise<string[]> {
    // This is a simplified version. In production, use Redis KEYS or SCAN
    // For now, return empty array - implement based on your Redis client
    return [];
  }
}

