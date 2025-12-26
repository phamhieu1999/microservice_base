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
import * as crypto from 'crypto';
import { createHash } from 'crypto';

@Injectable()
export class VNPayProvider implements IPaymentProvider {
  private readonly tmnCode = process.env.VNPAY_TMN_CODE || 'DEMO';
  private readonly secretKey = process.env.VNPAY_SECRET_KEY || 'DEMO_SECRET';
  private readonly returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/callback';
  private readonly apiUrl = process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const orderId = request.orderId;
    const amount = Math.round(request.amount * 100); // VNPay yêu cầu amount * 100
    const orderInfo = request.description || `Payment for order ${orderId}`;
    const orderType = 'other';
    const locale = 'vn';
    const currCode = 'VND';
    const createDate = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + '000';

    const vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Amount: amount.toString(),
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    // Sort và tạo query string
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {} as Record<string, string>);

    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', this.secretKey);
    hmac.update(signData);
    const vnp_SecureHash = hmac.digest('hex');

    const paymentUrl = `${this.apiUrl}?${signData}&vnp_SecureHash=${vnp_SecureHash}`;

    return {
      success: true,
      paymentId: orderId,
      providerTxnId: orderId,
      paymentUrl,
    };
  }

  verifyWebhook(payload: WebhookPayload, signature: string): boolean {
    // VNPay webhook verification
    const vnp_Params: Record<string, string> = payload.metadata || {};
    const vnp_SecureHash = signature;

    // Remove signature from params
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const signData = new URLSearchParams(
      Object.keys(vnp_Params)
        .sort()
        .reduce((acc, key) => {
          acc[key] = vnp_Params[key];
          return acc;
        }, {} as Record<string, string>),
    ).toString();

    const hmac = crypto.createHmac('sha512', this.secretKey);
    hmac.update(signData);
    const calculatedHash = hmac.digest('hex');

    return calculatedHash === vnp_SecureHash;
  }

  async processWebhook(payload: WebhookPayload): Promise<{ paymentId: string; status: PaymentStatus }> {
    const vnp_ResponseCode = payload.metadata?.vnp_ResponseCode || '99';
    const orderId = payload.metadata?.vnp_TxnRef || '';

    // VNPay response codes: 00 = success, others = failed
    const status: PaymentStatus = vnp_ResponseCode === '00' ? 'SUCCESS' : 'FAILED';

    return {
      paymentId: orderId,
      status,
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    // VNPay refund API implementation
    // This is a simplified version, real implementation needs to call VNPay API
    return {
      success: true,
      refundId: `refund-${Date.now()}`,
      providerRefundId: `vnpay-refund-${Date.now()}`,
    };
  }

  async queryStatus(providerTxnId: string): Promise<PaymentStatus> {
    // VNPay query API implementation
    // This is a simplified version, real implementation needs to call VNPay API
    return 'PENDING';
  }
}

