import { Injectable, Optional } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { CartItemDto } from './dto/cart-item.dto';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class CartService {
  constructor(
    private readonly repo: CartRepository,
    @Optional() private readonly cache?: CacheService,
  ) {}

  async getCart(userId: string) {
    const cacheKey = `cart:${userId}`;
    return this.cache?.getOrSet(
      cacheKey,
      async () => {
        return this.repo.getByUserId(userId);
      },
      300, // 5 minutes TTL
    ) || this.repo.getByUserId(userId);
  }

  async upsertItem(userId: string, item: CartItemDto) {
    const result = await this.repo.upsertItem(userId, item);
    // Invalidate cache
    if (this.cache) {
      await this.cache.del(`cart:${userId}`);
    }
    return result;
  }

  async removeItem(userId: string, productId: string) {
    const result = await this.repo.removeItem(userId, productId);
    // Invalidate cache
    if (this.cache) {
      await this.cache.del(`cart:${userId}`);
    }
    return result;
  }
}


