import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    // cache-manager v6 trả về T | null, trong khi code sử dụng T | undefined
    // Chuẩn hoá về undefined để tránh lỗi kiểu
    const value = await this.cacheManager.get<T>(key);
    return (value === null ? undefined : value) as T | undefined;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    // Kiểu Cache trong typings không khai báo reset, nhưng một số store (Redis) có hỗ trợ
    const manager: any = this.cacheManager as any;
    if (typeof manager.reset === 'function') {
      await manager.reset();
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

