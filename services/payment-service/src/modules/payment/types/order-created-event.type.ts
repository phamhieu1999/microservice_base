export interface OrderItemForPayment {
  productId: string;
  quantity: number;
  unitPrice: number;
  sellerId?: string;
}

// Bản sao nhẹ của OrderCreatedEvent từ order-service, chỉ lấy field cần thiết
export interface OrderCreatedEvent {
  id: string;
  userId: string;
  totalAmount: number;
  orderGroupId?: string;
  voucherId?: string;
  items?: OrderItemForPayment[];
}
