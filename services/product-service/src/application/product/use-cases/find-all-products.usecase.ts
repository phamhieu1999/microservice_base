import { Inject, Injectable } from '@nestjs/common';
import { IProductRepository, FindAllOptions, PaginatedResult } from '../../../domain/product/product.repository';
import { Product } from '../../../domain/product/product.entity';

@Injectable()
export class FindAllProductsUseCase {
  constructor(@Inject('IProductRepository') private readonly repo: IProductRepository) {}

  execute(options?: FindAllOptions): Promise<PaginatedResult<Product>> {
    return this.repo.findAll(options);
  }
}


