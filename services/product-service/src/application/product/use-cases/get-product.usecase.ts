import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { IProductRepository } from '../../../domain/product/product.repository';
import { Product } from '../../../domain/product/product.entity';
import { CacheService } from '../../../common/cache/cache.service';

@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject('IProductRepository') private readonly repo: IProductRepository,
    @Optional() private readonly cache?: CacheService,
  ) {}

  async execute(id: string): Promise<Product> {
    const cacheKey = `product:${id}`;
    
    // Try to get from cache
    if (this.cache) {
      const cached = await this.cache.get<Product>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Get from repository
    const product = await this.repo.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Cache the product (TTL: 5 minutes)
    if (this.cache) {
      await this.cache.set(cacheKey, product, 300);
    }

    return product;
  }
}


