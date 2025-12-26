import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly cache: CacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, query, user } = request;

    // Cache GET requests only
    if (method !== 'GET') {
      return next.handle();
    }

    // Build cache key including user ID if authenticated
    const userId = user?.userId || 'anonymous';
    const queryString = Object.keys(query).length > 0 ? `?${new URLSearchParams(query).toString()}` : '';
    const cacheKey = `gateway:${method}:${url}${queryString}:user:${userId}`;

    // Try to get from cache
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    // Execute handler and cache response
    return next.handle().pipe(
      tap((data) => {
        // Cache for 1 minute (60 seconds)
        this.cache.set(cacheKey, data, 60).catch((err) => {
          console.error('Error caching response:', err);
        });
      }),
    );
  }
}

