// Trạng thái domain tương ứng với entity OrderStatus ở layer persistence
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PAYMENT_EXPIRED'
  | 'BUYER_CANCEL_REQUESTED'
  | 'SELLER_CANCELLED'
  | 'SYSTEM_CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'RETURN_IN_TRANSIT'
  | 'RETURN_RECEIVED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface OrderItemProps {
  productId: string;
  quantity: number;
  unitPrice: number;
  sellerId?: string;
}

export class Order {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public status: OrderStatus,
    public readonly totalAmount: number,
    public readonly items: OrderItemProps[],
    public readonly orderGroupId?: string,
    public readonly voucherId?: string,
    public readonly discountAmount?: number,
    public readonly shippingFee?: number,
    public readonly paymentMethod?: 'CARD' | 'EWALLET' | 'BANK_TRANSFER' | 'COD',
  ) {}
}


