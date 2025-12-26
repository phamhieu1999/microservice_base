import { Injectable, BadRequestException, NotFoundException, Inject, Optional } from '@nestjs/common';
import { IProductRepository } from '../../domain/product/product.repository';
import { KafkaService } from '../../kafka/kafka.service';

export interface ReserveStockInput {
  productId: string;
  quantity: number;
}

export interface ReleaseStockInput {
  productId: string;
  quantity: number;
}

@Injectable()
export class InventoryService {
  constructor(
    @Inject('IProductRepository') private readonly productRepo: IProductRepository,
    @Optional() private readonly kafka?: KafkaService,
  ) {}

  /**
   * Reserve stock for an order
   * @throws NotFoundException if product not found
   * @throws BadRequestException if insufficient stock
   */
  async reserveStock(input: ReserveStockInput): Promise<void> {
    const product = await this.productRepo.findById(input.productId);
    if (!product) {
      throw new NotFoundException(`Product ${input.productId} not found`);
    }

    if (product.stock < input.quantity) {
      throw new BadRequestException(
        `Insufficient stock for product ${input.productId}. Available: ${product.stock}, Requested: ${input.quantity}`,
      );
    }

    // Atomic update: decrement stock
    const updatedProduct = await this.productRepo.decrementStock(input.productId, input.quantity);

    // Check for low stock alert
    // Note: We need to get full product details to check lowStockThreshold
    // For now, we'll use a default threshold of 10
    if (this.kafka && updatedProduct) {
      const lowStockThreshold = 10; // Default threshold, can be configured per product
      if (updatedProduct.stock <= lowStockThreshold) {
        await this.kafka.emit('product.low-stock', {
          productId: updatedProduct.id,
          productName: updatedProduct.name,
          currentStock: updatedProduct.stock,
          lowStockThreshold,
          sellerId: updatedProduct.sellerId,
        });
      }
    }
  }

  /**
   * Release reserved stock (e.g., when order is cancelled)
   */
  async releaseStock(input: ReleaseStockInput): Promise<void> {
    const product = await this.productRepo.findById(input.productId);
    if (!product) {
      // Log warning but don't throw - product might have been deleted
      console.warn(`Product ${input.productId} not found when releasing stock`);
      return;
    }

    // Atomic update: increment stock
    await this.productRepo.incrementStock(input.productId, input.quantity);
  }

  /**
   * Reserve stock for multiple products (transaction-like)
   * All or nothing - if any product has insufficient stock, rollback all
   */
  async reserveStockBatch(items: ReserveStockInput[]): Promise<void> {
    // Check all products first
    const products = await Promise.all(
      items.map((item) => this.productRepo.findById(item.productId)),
    );

    // Validate all products exist and have sufficient stock
    for (let i = 0; i < items.length; i++) {
      const product = products[i];
      const item = items[i];

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${item.productId}. Available: ${product.stock}, Requested: ${item.quantity}`,
        );
      }
    }

    // All validations passed, reserve stock for all
    await Promise.all(
      items.map((item) => this.productRepo.decrementStock(item.productId, item.quantity)),
    );
  }

  /**
   * Release stock for multiple products
   */
  async releaseStockBatch(items: ReleaseStockInput[]): Promise<void> {
    await Promise.all(
      items.map((item) => this.releaseStock(item)),
    );
  }

  /**
   * Check stock availability for multiple products
   */
  async checkStockAvailability(items: ReserveStockInput[]): Promise<Map<string, boolean>> {
    const products = await Promise.all(
      items.map((item) => this.productRepo.findById(item.productId)),
    );

    const availability = new Map<string, boolean>();
    for (let i = 0; i < items.length; i++) {
      const product = products[i];
      const item = items[i];

      if (!product) {
        availability.set(item.productId, false);
        continue;
      }

      availability.set(item.productId, product.stock >= item.quantity);
    }

    return availability;
  }
}

