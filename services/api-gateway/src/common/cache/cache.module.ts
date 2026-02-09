import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheModule');
        const redisHost = configService.get('REDIS_HOST') || 'localhost';
        const redisPort = configService.get('REDIS_PORT') || 6379;
        const redisEnabled = (configService.get('REDIS_ENABLED') || 'true') !== 'false';

        if (!redisEnabled) {
          logger.warn('Redis disabled (REDIS_ENABLED=false), using in-memory cache');
          return {
            ttl: 60 * 1000, // Default TTL: 1 minute (in milliseconds)
          };
        }

        // Retry logic với exponential backoff
        const maxRetries = 5;
        let retryCount = 0;
        let store = null;

        while (retryCount < maxRetries && !store) {
          try {
            store = await redisStore({
              socket: {
                host: redisHost,
                port: redisPort,
                connectTimeout: 5000, // 5 seconds timeout
              },
              ttl: 60 * 1000, // Default TTL: 1 minute (in milliseconds)
            });
            logger.log(`Redis connected to ${redisHost}:${redisPort}`);
          } catch (err) {
            retryCount++;
            if (retryCount < maxRetries) {
              const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
              logger.warn(
                `Redis connect failed (attempt ${retryCount}/${maxRetries}): ${(err as Error).message}. Retrying in ${backoffMs}ms...`,
              );
              await new Promise(resolve => setTimeout(resolve, backoffMs));
            } else {
              logger.error(
                `Redis connect failed after ${maxRetries} attempts: ${(err as Error).message}. Falling back to in-memory cache.`,
              );
              // Fallback to in-memory cache
              return {
                ttl: 60 * 1000, // Default TTL: 1 minute (in milliseconds)
              };
            }
          }
        }

        return {
          store,
          ttl: 60 * 1000, // Default TTL: 1 minute (in milliseconds)
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}

