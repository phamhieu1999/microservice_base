import { Injectable, Optional } from '@nestjs/common';
import { RefreshTokenRepository } from '../../../modules/auth/refresh-token.repository';
import { SessionCacheService } from '../../../common/cache/session.cache';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
    @Optional() private readonly sessionCache?: SessionCacheService,
  ) {}

  async execute(userId: string) {
    await this.refreshTokenRepo.revokeAllForUser(userId);
    // Invalidate user session cache
    if (this.sessionCache) {
      await this.sessionCache.invalidateAllUserSessions(userId);
    }
  }
}


