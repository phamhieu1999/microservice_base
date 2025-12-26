import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductIndex, ProductIndexDocument } from './schemas/product-index.schema';
import { CacheService } from '../../common/cache/cache.service';
import { ElasticsearchService } from './elasticsearch.service';

@Injectable()
export class SearchService {
  private useElasticsearch: boolean;

  constructor(
    @InjectModel(ProductIndex.name)
    private readonly productIndexModel: Model<ProductIndexDocument>,
    @Optional() private readonly cache?: CacheService,
    @Optional() private readonly elasticsearch?: ElasticsearchService,
  ) {
    // Use Elasticsearch if available, otherwise fallback to MongoDB
    this.useElasticsearch = !!elasticsearch && process.env.USE_ELASTICSEARCH === 'true';
  }

  async indexProduct(product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    category?: string;
    brand?: string;
    sellerId?: string;
  }) {
    const searchText = [
      product.name,
      product.description,
      product.category,
      product.brand,
    ]
      .filter(Boolean)
      .join(' ');

    // Index in MongoDB (for fallback)
    await this.productIndexModel.findOneAndUpdate(
      { productId: product.id },
      {
        productId: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        brand: product.brand,
        sellerId: product.sellerId,
        searchText,
      },
      { upsert: true },
    );

    // Index in Elasticsearch if available
    if (this.useElasticsearch && this.elasticsearch) {
      await this.elasticsearch.indexProduct(product);
    }

    // Invalidate cache for this product's category and brand
    if (this.cache) {
      if (product.category) {
        await this.cache.invalidatePattern(`search:category:${product.category}:`);
      }
      if (product.brand) {
        await this.cache.invalidatePattern(`search:brand:${product.brand}:`);
      }
      // Invalidate general search cache
      await this.cache.invalidatePattern('search:');
    }
  }

  async removeProduct(productId: string) {
    await this.productIndexModel.deleteOne({ productId });
  }

  async search(
    query: string,
    limit = 20,
    skip = 0,
    filters?: {
      category?: string;
      brand?: string;
      minPrice?: number;
      maxPrice?: number;
    },
  ) {
    // Generate cache key
    const cacheKey = `search:${query}:${limit}:${skip}:${JSON.stringify(filters || {})}`;

    // Try to get from cache
    if (this.cache) {
      const cached = await this.cache.get<any[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Use Elasticsearch if available
    if (this.useElasticsearch && this.elasticsearch) {
      const results = await this.elasticsearch.search(query, limit, skip, filters);
      if (this.cache) {
        await this.cache.set(cacheKey, results, 300);
      }
      return results;
    }

    // Fallback to MongoDB text search
    const results = await this.productIndexModel
      .find(
        {
          $text: { $search: query },
          stock: { $gt: 0 },
          ...(filters?.category && { category: filters.category }),
          ...(filters?.brand && { brand: filters.brand }),
          ...(filters?.minPrice !== undefined || filters?.maxPrice !== undefined
            ? {
                price: {
                  ...(filters.minPrice !== undefined && { $gte: filters.minPrice }),
                  ...(filters.maxPrice !== undefined && { $lte: filters.maxPrice }),
                },
              }
            : {}),
        },
        { score: { $meta: 'textScore' } },
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .skip(skip)
      .exec();

    // Fallback: nếu không có kết quả từ text search, tìm theo regex
    let finalResults = results;
    if (results.length === 0) {
      const regex = new RegExp(query, 'i');
      finalResults = await this.productIndexModel
        .find({
          $or: [
            { name: regex },
            { description: regex },
            { category: regex },
            { brand: regex },
          ],
          stock: { $gt: 0 },
        })
        .limit(limit)
        .skip(skip)
        .exec();
    }

    // Cache results (TTL: 5 minutes)
    if (this.cache) {
      await this.cache.set(cacheKey, finalResults, 300);
    }

    return finalResults;
  }

  async searchByCategory(category: string, limit = 20, skip = 0) {
    const cacheKey = `search:category:${category}:${limit}:${skip}`;

    if (this.cache) {
      const cached = await this.cache.get<any[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Use Elasticsearch if available
    if (this.useElasticsearch && this.elasticsearch) {
      const results = await this.elasticsearch.searchByCategory(category, limit, skip);
      if (this.cache) {
        await this.cache.set(cacheKey, results, 300);
      }
      return results;
    }

    const results = await this.productIndexModel
      .find({ category, stock: { $gt: 0 } })
      .limit(limit)
      .skip(skip)
      .exec();

    if (this.cache) {
      await this.cache.set(cacheKey, results, 300);
    }

    return results;
  }

  async searchByBrand(brand: string, limit = 20, skip = 0) {
    const cacheKey = `search:brand:${brand}:${limit}:${skip}`;

    if (this.cache) {
      const cached = await this.cache.get<any[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Use Elasticsearch if available
    if (this.useElasticsearch && this.elasticsearch) {
      const results = await this.elasticsearch.searchByBrand(brand, limit, skip);
      if (this.cache) {
        await this.cache.set(cacheKey, results, 300);
      }
      return results;
    }

    const results = await this.productIndexModel
      .find({ brand, stock: { $gt: 0 } })
      .limit(limit)
      .skip(skip)
      .exec();

    if (this.cache) {
      await this.cache.set(cacheKey, results, 300);
    }

    return results;
  }
}

