import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(to: string, subject: string, html: string) {
    // TODO: Integrate with email provider (SendGrid, AWS SES, etc.)
    // For now, just log
    this.logger.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    this.logger.debug(`[EMAIL] Body: ${html}`);

    // In production, use:
    // - SendGrid: @sendgrid/mail
    // - AWS SES: @aws-sdk/client-ses
    // - Nodemailer: nodemailer

    return { success: true, messageId: `mock-${Date.now()}` };
  }

  async sendWelcomeEmail(to: string, userName: string) {
    const html = `
      <html>
        <body>
          <h1>Chào mừng ${userName}!</h1>
          <p>Cảm ơn bạn đã đăng ký tài khoản.</p>
        </body>
      </html>
    `;
    return this.sendEmail(to, 'Chào mừng bạn đến với E-commerce Platform', html);
  }

  async sendOrderConfirmationEmail(to: string, orderId: string, totalAmount: number) {
    const html = `
      <html>
        <body>
          <h1>Đơn hàng #${orderId} đã được tạo</h1>
          <p>Tổng tiền: ${totalAmount.toLocaleString('vi-VN')} VNĐ</p>
        </body>
      </html>
    `;
    return this.sendEmail(to, `Xác nhận đơn hàng #${orderId}`, html);
  }

  async sendPaymentSuccessEmail(to: string, orderId: string, amount: number) {
    const html = `
      <html>
        <body>
          <h1>Thanh toán thành công</h1>
          <p>Đơn hàng #${orderId}</p>
          <p>Số tiền: ${amount.toLocaleString('vi-VN')} VNĐ</p>
        </body>
      </html>
    `;
    return this.sendEmail(to, `Thanh toán thành công cho đơn hàng #${orderId}`, html);
  }
}

