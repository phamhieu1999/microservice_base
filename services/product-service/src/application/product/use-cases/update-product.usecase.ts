import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { IProductRepository } from '../../../domain/product/product.repository';
import { Product } from '../../../domain/product/product.entity';
import { UpdateProductDto } from '../../../modules/product/dto/update-product.dto';
import {
  PRODUCT_UPDATED_TOPIC,
  ProductUpdatedEvent,
} from '../../../modules/product/events/product-events';
import { KafkaService } from '../../../kafka/kafka.service';
import { InjectModel } from '@nestjs/mongoose';
import { Product as MongoProduct } from '../../../modules/product/schemas/product.schema';
import { Model } from 'mongoose';
import { mongoToDomain } from '../mappers/product.mapper';
import { CacheService } from '../../../common/cache/cache.service';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject('IProductRepository') private readonly repo: IProductRepository,
    private readonly kafka: KafkaService,
    @InjectModel(MongoProduct.name) private readonly model: Model<MongoProduct>,
    @Optional() private readonly cache?: CacheService,
  ) {}

  async execute(id: string, dto: UpdateProductDto): Promise<Product> {
    // đơn giản: dùng model trực tiếp để update, sau đó map sang domain
    const updated = await this.model
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Product not found');
    }

    const product = mongoToDomain(updated);

    const event: ProductUpdatedEvent = {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
    };
    await this.kafka.emit(PRODUCT_UPDATED_TOPIC, event);

    // Invalidate cache - Write-through + Event-driven invalidation
    if (this.cache) {
      await this.cache.del(`product:${id}`);
      // Invalidate search cache patterns
      if (updated.category) {
        await this.cache.invalidatePattern(`search:category:${updated.category}:`);
      }
      if (updated.brand) {
        await this.cache.invalidatePattern(`search:brand:${updated.brand}:`);
      }
      // Invalidate general search cache
      await this.cache.invalidatePattern('search:');
      // Invalidate analytics cache
      await this.cache.invalidatePattern('analytics:top-products:');
    }

    return product;
  }
}


