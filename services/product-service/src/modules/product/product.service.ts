import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { KafkaService } from '../../kafka/kafka.service';
import {
  PRODUCT_CREATED_TOPIC,
  PRODUCT_UPDATED_TOPIC,
  ProductCreatedEvent,
  ProductUpdatedEvent,
} from './events/product-events';

@Injectable()
export class ProductService {
  constructor(
    private readonly repo: ProductRepository,
    private readonly kafka: KafkaService,
  ) {}

  async create(dto: CreateProductDto) {
    const product = await this.repo.create(dto);
    const event: ProductCreatedEvent = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      brand: product.brand,
      sellerId: product.sellerId,
    };
    await this.kafka.emit(PRODUCT_CREATED_TOPIC, event);
    return product;
  }

  findAll(search?: string) {
    return this.repo.findAll(search);
  }

  async findOne(id: string) {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.repo.update(id, dto);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const event: ProductUpdatedEvent = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      brand: product.brand,
      sellerId: product.sellerId,
    };
    await this.kafka.emit(PRODUCT_UPDATED_TOPIC, event);
    return product;
  }
}


