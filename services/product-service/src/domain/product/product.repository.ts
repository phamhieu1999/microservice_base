import { Product } from './product.entity';

export interface FindAllOptions {
  search?: string;
  category?: string;
  brand?: string;
  sellerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IProductRepository {
  create(product: Omit<Product, 'id'>): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findAll(options?: FindAllOptions): Promise<PaginatedResult<Product>>;
  decrementStock(id: string, quantity: number): Promise<Product>;
  incrementStock(id: string, quantity: number): Promise<Product>;
}


