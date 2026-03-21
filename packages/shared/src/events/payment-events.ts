export interface SellerShare {
  sellerId: string;
  amount: number;
}

export interface PaymentSuccessEvent {
  orderId: string;
  paymentId: string;
  amount: number;
  userId?: string;
  sellerShares?: SellerShare[];
}

export interface PaymentFailedEvent {
  orderId: string;
  reason?: string;
  userId?: string;
}

export interface PaymentRefundSuccessEvent {
  orderId: string;
  paymentId: string;
  refundAmount: number;
  totalRefundedAmount: number;
  paymentStatus: 'REFUNDED' | 'PARTIALLY_REFUNDED';
  userId?: string;
}

export const PAYMENT_SUCCESS_TOPIC = 'payment.success';
export const PAYMENT_FAILED_TOPIC = 'payment.failed';
export const PAYMENT_REFUND_SUCCESS_TOPIC = 'payment.refund.success';
