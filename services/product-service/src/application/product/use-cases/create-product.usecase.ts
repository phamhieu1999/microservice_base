import { Inject, Injectable } from '@nestjs/common';
import { CreateProductDto } from '../../../modules/product/dto/create-product.dto';
import { IProductRepository } from '../../../domain/product/product.repository';
import { Product } from '../../../domain/product/product.entity';
import { KafkaService } from '../../../kafka/kafka.service';
import {
  PRODUCT_CREATED_TOPIC,
  ProductCreatedEvent,
} from '../../../modules/product/events/product-events';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject('IProductRepository') private readonly repo: IProductRepository,
    private readonly kafka: KafkaService,
  ) {}

  async execute(dto: CreateProductDto): Promise<Product> {
    const product = await this.repo.create(
      new Product(
        undefined as any,
        dto.name,
        dto.price,
        dto.stock,
        dto.description,
        dto.category,
        dto.brand,
        dto.sellerId,
      ),
    );

    const event: ProductCreatedEvent = {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
    };
    await this.kafka.emit(PRODUCT_CREATED_TOPIC, event);
    return product;
  }
}


