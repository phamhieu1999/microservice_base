export interface OrderCreatedEvent {
  id: string;
  userId: string;
  totalAmount: number;
  orderGroupId?: string;
  voucherId?: string;
  sellerId?: string; // sellerId đầu tiên từ items để auto tạo conversation
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


