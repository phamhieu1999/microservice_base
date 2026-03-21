export interface OrderCreatedEvent {
  id: string;
  userId: string;
  totalAmount: number;
  orderGroupId?: string;
  voucherId?: string;
  paymentMethod?: 'CARD' | 'EWALLET' | 'BANK_TRANSFER' | 'COD';
  sellerId?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    sellerId?: string;
  }>;
}

export interface OrderCancelledEvent {
  id: string;
  reason?: string;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
}

export const ORDER_CREATED_TOPIC = 'order.created';
export const ORDER_CANCELLED_TOPIC = 'order.cancelled';
