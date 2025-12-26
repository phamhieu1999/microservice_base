import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { NotificationService } from '../modules/notification/notification.service';

@Injectable()
export class NotificationConsumer implements OnModuleInit {
  private readonly logger = new Logger(NotificationConsumer.name);
  private readonly consumer: Consumer;

  constructor(private readonly notificationService: NotificationService) {
    const kafka = new Kafka({
      clientId: 'notification-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'notification-service-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'user.created', fromBeginning: true });
    await this.consumer.subscribe({ topic: 'order.created', fromBeginning: true });
    await this.consumer.subscribe({ topic: 'payment.success', fromBeginning: true });
    await this.consumer.subscribe({ topic: 'payment.failed', fromBeginning: true });
    await this.consumer.subscribe({ topic: 'product.low-stock', fromBeginning: true });
    await this.consumer.subscribe({ topic: 'dispute.opened', fromBeginning: true });
    await this.consumer.subscribe({ topic: 'dispute.escalated', fromBeginning: true });
    await this.consumer.subscribe({ topic: 'dispute.resolved', fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const payload = message.value ? JSON.parse(message.value.toString()) : null;
        if (!payload) return;

        try {
          await this.handleEvent(topic, payload);
        } catch (err) {
          this.logger.error(`Error handling ${topic}`, err as Error);
        }
      },
    });
  }

  private async handleEvent(topic: string, payload: any) {
    switch (topic) {
      case 'user.created':
        await this.notificationService.create(
          payload.id,
          'USER_CREATED',
          'Chào mừng bạn!',
          `Tài khoản ${payload.email} đã được tạo thành công.`,
          { userId: payload.id },
        );
        this.logger.log(`Created notification for user.created: ${payload.id}`);
        break;

      case 'order.created':
        await this.notificationService.create(
          payload.userId,
          'ORDER_CREATED',
          'Đơn hàng mới',
          `Đơn hàng #${payload.id} đã được tạo với tổng tiền ${payload.totalAmount} VNĐ.`,
          { orderId: payload.id, totalAmount: payload.totalAmount },
        );
        this.logger.log(`Created notification for order.created: ${payload.id}`);
        break;

      case 'payment.success':
        if (payload.userId) {
          await this.notificationService.create(
            payload.userId,
            'PAYMENT_SUCCESS',
            'Thanh toán thành công',
            `Thanh toán cho đơn hàng #${payload.orderId} đã thành công.`,
            { orderId: payload.orderId, paymentId: payload.paymentId, amount: payload.amount },
            {
              email: payload.userEmail,
              sms: payload.userPhone,
              push: payload.userDeviceToken ? { deviceToken: payload.userDeviceToken } : undefined,
            },
          );
          this.logger.log(`Created notification for payment.success: ${payload.orderId}`);
        }
        break;

      case 'payment.failed':
        // Payment failed event không có userId, cần query từ order service hoặc lưu userId trong event
        // Tạm thời skip nếu không có userId
        if (payload.userId) {
          await this.notificationService.create(
            payload.userId,
            'PAYMENT_FAILED',
            'Thanh toán thất bại',
            `Thanh toán cho đơn hàng #${payload.orderId} thất bại. Vui lòng thử lại.`,
            { orderId: payload.orderId, reason: payload.reason },
          );
          this.logger.log(`Created notification for payment.failed: ${payload.orderId}`);
        }
        break;

      case 'product.low-stock':
        // Low stock alert - notify seller
        if (payload.sellerId) {
          await this.notificationService.create(
            payload.sellerId,
            'PRODUCT_LOW_STOCK',
            'Cảnh báo hàng sắp hết',
            `Sản phẩm "${payload.productName}" (ID: ${payload.productId}) chỉ còn ${payload.currentStock} sản phẩm. Vui lòng nhập thêm hàng.`,
            {
              productId: payload.productId,
              productName: payload.productName,
              currentStock: payload.currentStock,
              lowStockThreshold: payload.lowStockThreshold,
            },
          );
          this.logger.log(`Created low stock notification for product: ${payload.productId}`);
        }
        break;

      case 'dispute.opened':
        // Notify user and seller when a dispute is opened
        await this.notificationService.create(
          payload.userId,
          'DISPUTE_OPENED',
          'Khiếu nại mới đã được tạo',
          `Bạn đã tạo khiếu nại cho đơn hàng #${payload.orderId} với lý do: ${payload.reasonCode}.`,
          { disputeId: payload.id, orderId: payload.orderId, reasonCode: payload.reasonCode },
        );
        if (payload.sellerId) {
          await this.notificationService.create(
            payload.sellerId,
            'DISPUTE_OPENED_SELLER',
            'Khách hàng vừa mở khiếu nại',
            `Có khiếu nại mới cho đơn hàng #${payload.orderId}. Vui lòng kiểm tra và phản hồi.`,
            { disputeId: payload.id, orderId: payload.orderId, reasonCode: payload.reasonCode },
          );
        }
        break;

      case 'dispute.escalated':
        // Notify support/admin via a special userId or channel; tạm notify seller
        if (payload.sellerId) {
          await this.notificationService.create(
            payload.sellerId,
            'DISPUTE_ESCALATED',
            'Khiếu nại đã được escalated',
            `Khiếu nại cho đơn hàng #${payload.orderId} đã được escalated lên bộ phận CS.`,
            { disputeId: payload.id, orderId: payload.orderId },
          );
        }
        break;

      case 'dispute.resolved':
        await this.notificationService.create(
          payload.userId,
          'DISPUTE_RESOLVED',
          'Khiếu nại đã được xử lý',
          `Khiếu nại cho đơn hàng #${payload.orderId} đã được ${payload.decision === 'RESOLVED' ? 'chấp nhận' : 'từ chối'}.`,
          { disputeId: payload.id, orderId: payload.orderId, decision: payload.decision },
        );
        if (payload.sellerId) {
          await this.notificationService.create(
            payload.sellerId,
            'DISPUTE_RESOLVED_SELLER',
            'Kết quả khiếu nại',
            `Khiếu nại cho đơn hàng #${payload.orderId} đã được ${payload.decision === 'RESOLVED' ? 'chấp nhận' : 'từ chối'}.`,
            { disputeId: payload.id, orderId: payload.orderId, decision: payload.decision },
          );
        }
        break;
    }
  }
}


