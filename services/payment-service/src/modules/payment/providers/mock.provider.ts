import { Injectable } from '@nestjs/common';
import {
  IPaymentProvider,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
} from './payment-provider.interface';
import { PaymentStatus } from '../../../database/entities/payment.entity';

@Injectable()
export class MockProvider implements IPaymentProvider {
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Mock: random success/failed
    const success = Math.random() > 0.2;
    const providerTxnId = `mock-txn-${Date.now()}`;

    if (success) {
      return {
        success: true,
        paymentId: request.orderId,
        providerTxnId,
        paymentUrl: `http://mock-payment.com/pay/${providerTxnId}`,
      };
    } else {
      return {
        success: false,
        paymentId: request.orderId,
        error: 'MOCK_PROVIDER_FAILED',
      };
    }
  }

  verifyWebhook(payload: WebhookPayload, signature: string): boolean {
    // Mock: always return true
    return true;
  }

  async processWebhook(payload: WebhookPayload): Promise<{ paymentId: string; status: PaymentStatus }> {
    return {
      paymentId: payload.metadata?.orderId || '',
      status: payload.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    return {
      success: true,
      refundId: `refund-${Date.now()}`,
      providerRefundId: `mock-refund-${Date.now()}`,
    };
  }

  async queryStatus(providerTxnId: string): Promise<PaymentStatus> {
    // Mock: random status
    const statuses: PaymentStatus[] = ['PENDING', 'SUCCESS', 'FAILED'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }
}

