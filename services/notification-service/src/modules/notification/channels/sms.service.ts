import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendSMS(to: string, message: string) {
    // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    // For now, just log
    this.logger.log(`[SMS] To: ${to}, Message: ${message}`);

    // In production, use:
    // - Twilio: twilio
    // - AWS SNS: @aws-sdk/client-sns
    // - Vonage: @vonage/server-sdk

    return { success: true, messageId: `mock-sms-${Date.now()}` };
  }

  async sendOrderConfirmationSMS(to: string, orderId: string) {
    const message = `Đơn hàng #${orderId} đã được tạo thành công. Cảm ơn bạn đã mua sắm!`;
    return this.sendSMS(to, message);
  }

  async sendPaymentSuccessSMS(to: string, orderId: string, amount: number) {
    const message = `Thanh toán thành công cho đơn hàng #${orderId}. Số tiền: ${amount.toLocaleString('vi-VN')} VNĐ`;
    return this.sendSMS(to, message);
  }
}

