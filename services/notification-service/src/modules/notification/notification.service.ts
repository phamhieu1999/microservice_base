import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { EmailService } from './channels/email.service';
import { SmsService } from './channels/sms.service';
import { PushService } from './channels/push.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @Optional() private readonly emailService?: EmailService,
    @Optional() private readonly smsService?: SmsService,
    @Optional() private readonly pushService?: PushService,
  ) {}

  async create(
    userId: string,
    type: string,
    title: string,
    content: string,
    metadata?: any,
    channels?: { email?: string; sms?: string; push?: { deviceToken: string } },
  ) {
    // Create in-app notification
    const notification = await this.notificationModel.create({
      userId,
      type,
      title,
      content,
      metadata,
    });

    // Send via multiple channels
    if (channels?.email && this.emailService) {
      try {
        if (type === 'USER_CREATED') {
          await this.emailService.sendWelcomeEmail(channels.email, metadata?.userName || 'User');
        } else if (type === 'ORDER_CREATED') {
          await this.emailService.sendOrderConfirmationEmail(
            channels.email,
            metadata?.orderId,
            metadata?.totalAmount || 0,
          );
        } else if (type === 'PAYMENT_SUCCESS') {
          await this.emailService.sendPaymentSuccessEmail(
            channels.email,
            metadata?.orderId,
            metadata?.amount || 0,
          );
        }
      } catch (err) {
        console.error('Error sending email', err);
      }
    }

    if (channels?.sms && this.smsService) {
      try {
        if (type === 'ORDER_CREATED') {
          await this.smsService.sendOrderConfirmationSMS(channels.sms, metadata?.orderId);
        } else if (type === 'PAYMENT_SUCCESS') {
          await this.smsService.sendPaymentSuccessSMS(
            channels.sms,
            metadata?.orderId,
            metadata?.amount || 0,
          );
        }
      } catch (err) {
        console.error('Error sending SMS', err);
      }
    }

    if (channels?.push?.deviceToken && this.pushService) {
      try {
        if (type === 'ORDER_CREATED') {
          await this.pushService.sendOrderNotification(userId, channels.push.deviceToken, metadata?.orderId);
        } else if (type === 'PAYMENT_SUCCESS') {
          await this.pushService.sendPaymentNotification(userId, channels.push.deviceToken, metadata?.orderId);
        }
      } catch (err) {
        console.error('Error sending push notification', err);
      }
    }

    return notification;
  }

  async listByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.notificationModel
        .find({ userId })
        .select('id userId type title content read metadata createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.notificationModel.countDocuments({ userId }).exec(),
    ]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.notificationModel.updateOne(
      { _id: notificationId, userId },
      { read: true },
    );
  }

  async getUnreadCount(userId: string) {
    return this.notificationModel.countDocuments({ userId, read: false }).exec();
  }
}
