export interface SellerShare {
  sellerId: string;
  amount: number;
}

export interface PaymentSuccessEvent {
  orderId: string;
  paymentId: string;
  amount: number;
  userId?: string; // để notification service tạo notification cho đúng user
  sellerShares?: SellerShare[]; // phân bổ số tiền cho từng seller (multi-seller)
}

export interface PaymentFailedEvent {
  orderId: string;
  reason?: string;
  userId?: string; // để notification service tạo notification cho đúng user
}

export const PAYMENT_SUCCESS_TOPIC = 'payment.success';
export const PAYMENT_FAILED_TOPIC = 'payment.failed';


