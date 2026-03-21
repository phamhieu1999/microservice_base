export interface PaymentRequest {
  orderId: string;
  amount: number;
  method?: 'CARD' | 'EWALLET' | 'BANK_TRANSFER' | 'COD';
  currency?: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  providerTxnId?: string;
  paymentUrl?: string; // URL để redirect user đến payment page
  qrCode?: string; // QR code cho mobile payment
  error?: string;
}

export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  providerRefundId?: string;
  error?: string;
}

import { PaymentStatus } from '../../../database/entities/payment.entity';

export interface WebhookPayload {
  providerTxnId: string;
  status: 'SUCCESS' | 'FAILED';
  amount?: number;
  metadata?: Record<string, any>;
  signature?: string; // Để verify webhook
}

export interface IPaymentProvider {
  /**
   * Tạo payment request và trả về payment URL hoặc QR code
   */
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Verify webhook từ provider
   */
  verifyWebhook(payload: WebhookPayload, signature: string): boolean;

  /**
   * Process webhook và trả về payment status
   */
  processWebhook(payload: WebhookPayload): Promise<{ paymentId: string; status: PaymentStatus }>;

  /**
   * Refund payment
   */
  refund(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Query payment status từ provider
   */
  queryStatus(providerTxnId: string): Promise<PaymentStatus>;
}

