export interface ProductCreatedEvent {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  brand?: string;
  sellerId?: string;
}

export interface ProductUpdatedEvent {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  brand?: string;
  sellerId?: string;
}

export const PRODUCT_CREATED_TOPIC = 'product.created';
export const PRODUCT_UPDATED_TOPIC = 'product.updated';


