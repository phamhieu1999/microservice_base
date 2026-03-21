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
    const method = request.method || 'CARD';
    const providerTxnId = `mock-${method.toLowerCase()}-${Date.now()}`;

    switch (method) {
      case 'COD':
        return this.createCodPayment(request, providerTxnId);
      case 'EWALLET':
        return this.createEwalletPayment(request, providerTxnId);
      case 'BANK_TRANSFER':
        return this.createBankTransferPayment(request, providerTxnId);
      case 'CARD':
      default:
        return this.createCardPayment(request, providerTxnId);
    }
  }

  private async createCardPayment(request: PaymentRequest, providerTxnId: string): Promise<PaymentResponse> {
    const success = Math.random() > 0.2;
    if (!success) {
      return {
        success: false,
        paymentId: request.orderId,
        error: 'CARD_DECLINED',
      };
    }
    return {
      success: true,
      paymentId: request.orderId,
      providerTxnId,
      paymentUrl: `http://mock-payment.com/card/checkout/${providerTxnId}?amount=${request.amount}&returnUrl=${encodeURIComponent(request.returnUrl || '')}`,
    };
  }

  private async createEwalletPayment(request: PaymentRequest, providerTxnId: string): Promise<PaymentResponse> {
    const success = Math.random() > 0.1;
    if (!success) {
      return {
        success: false,
        paymentId: request.orderId,
        error: 'EWALLET_UNAVAILABLE',
      };
    }
    const qrPayload = JSON.stringify({
      txnId: providerTxnId,
      amount: request.amount,
      merchant: 'MOCK_MERCHANT',
      expiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    const qrCode = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text y="20">${Buffer.from(qrPayload).toString('base64').slice(0, 40)}</text></svg>`;

    return {
      success: true,
      paymentId: request.orderId,
      providerTxnId,
      qrCode,
      paymentUrl: `http://mock-payment.com/ewallet/qr/${providerTxnId}`,
    };
  }

  private async createBankTransferPayment(request: PaymentRequest, providerTxnId: string): Promise<PaymentResponse> {
    const bankInfo = {
      bankName: 'Mock Bank (Vietcombank)',
      accountNumber: '1234567890',
      accountHolder: 'CONG TY MOCK PAYMENT',
      branch: 'Ho Chi Minh',
      transferContent: `PAY ${providerTxnId}`,
      amount: request.amount,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    return {
      success: true,
      paymentId: request.orderId,
      providerTxnId,
      paymentUrl: `http://mock-payment.com/bank-transfer/${providerTxnId}?info=${encodeURIComponent(JSON.stringify(bankInfo))}`,
    };
  }

  private async createCodPayment(request: PaymentRequest, providerTxnId: string): Promise<PaymentResponse> {
    return {
      success: true,
      paymentId: request.orderId,
      providerTxnId,
    };
  }

  verifyWebhook(_payload: WebhookPayload, _signature: string): boolean {
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

  async queryStatus(_providerTxnId: string): Promise<PaymentStatus> {
    const statuses: PaymentStatus[] = ['PENDING', 'SUCCESS', 'FAILED'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }
}
