import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    if (typeof (this.cacheManager as any).reset === 'function') {
      await (this.cacheManager as any).reset();
    } else if (typeof (this.cacheManager as any).store?.reset === 'function') {
      await (this.cacheManager as any).store.reset();
    } else {
      // fallback: try to delete all keys if keys() is available
      if (typeof (this.cacheManager as any).keys === 'function') {
        const keys = await (this.cacheManager as any).keys();
        await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));
      } else {
        throw new Error('Reset not supported by cache manager.');
      }
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

