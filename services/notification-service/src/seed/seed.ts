import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { Notification, NotificationSchema } from '../modules/notification/schemas/notification.schema';
import { Model } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const connection = app.get<Connection>(getConnectionToken());
    
    // Get or create Notification model
    const NotificationModel = (connection.models[Notification.name] ||
      connection.model(Notification.name, NotificationSchema)) as Model<typeof Notification>;

    console.log('🌱 Starting notification data seeding...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    const deleteResult = await NotificationModel.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing notifications`);

    // Sample notification data
    const notifications = [
      // Order notifications
      {
        userId: 'user_001',
        type: 'ORDER_CREATED',
        title: 'Đơn hàng đã được tạo',
        content: 'Đơn hàng #ORD-2024-001 của bạn đã được tạo thành công. Tổng tiền: 1,299,000 VNĐ',
        read: false,
        metadata: {
          orderId: 'ORD-2024-001',
          amount: 1299000,
          items: 3,
        },
      },
      {
        userId: 'user_001',
        type: 'ORDER_CREATED',
        title: 'Đơn hàng đã được tạo',
        content: 'Đơn hàng #ORD-2024-002 của bạn đã được tạo thành công. Tổng tiền: 2,499,000 VNĐ',
        read: true,
        metadata: {
          orderId: 'ORD-2024-002',
          amount: 2499000,
          items: 2,
        },
      },
      {
        userId: 'user_002',
        type: 'ORDER_CREATED',
        title: 'Đơn hàng đã được tạo',
        content: 'Đơn hàng #ORD-2024-003 của bạn đã được tạo thành công. Tổng tiền: 899,000 VNĐ',
        read: false,
        metadata: {
          orderId: 'ORD-2024-003',
          amount: 899000,
          items: 1,
        },
      },
      // Payment notifications
      {
        userId: 'user_001',
        type: 'PAYMENT_SUCCESS',
        title: 'Thanh toán thành công',
        content: 'Thanh toán cho đơn hàng #ORD-2024-001 đã thành công. Số tiền: 1,299,000 VNĐ',
        read: false,
        metadata: {
          orderId: 'ORD-2024-001',
          paymentId: 'PAY-2024-001',
          amount: 1299000,
          paymentMethod: 'VNPay',
        },
      },
      {
        userId: 'user_001',
        type: 'PAYMENT_SUCCESS',
        title: 'Thanh toán thành công',
        content: 'Thanh toán cho đơn hàng #ORD-2024-002 đã thành công. Số tiền: 2,499,000 VNĐ',
        read: true,
        metadata: {
          orderId: 'ORD-2024-002',
          paymentId: 'PAY-2024-002',
          amount: 2499000,
          paymentMethod: 'MoMo',
        },
      },
      {
        userId: 'user_002',
        type: 'PAYMENT_FAILED',
        title: 'Thanh toán thất bại',
        content: 'Thanh toán cho đơn hàng #ORD-2024-003 thất bại. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.',
        read: false,
        metadata: {
          orderId: 'ORD-2024-003',
          paymentId: 'PAY-2024-003',
          amount: 899000,
          paymentMethod: 'VNPay',
          reason: 'Insufficient balance',
        },
      },
      // Message notifications
      {
        userId: 'user_001',
        type: 'MESSAGE_RECEIVED',
        title: 'Tin nhắn mới',
        content: 'Bạn có tin nhắn mới từ người bán về đơn hàng #ORD-2024-001',
        read: false,
        metadata: {
          senderId: 'seller_001',
          senderName: 'Cửa hàng điện tử ABC',
          orderId: 'ORD-2024-001',
        },
      },
      {
        userId: 'user_002',
        type: 'MESSAGE_RECEIVED',
        title: 'Tin nhắn mới',
        content: 'Bạn có tin nhắn mới từ hệ thống',
        read: true,
        metadata: {
          senderId: 'system',
          senderName: 'Hệ thống',
        },
      },
      // Shipping notifications
      {
        userId: 'user_001',
        type: 'ORDER_SHIPPED',
        title: 'Đơn hàng đã được giao',
        content: 'Đơn hàng #ORD-2024-001 của bạn đã được giao thành công. Vui lòng kiểm tra và đánh giá sản phẩm.',
        read: false,
        metadata: {
          orderId: 'ORD-2024-001',
          trackingNumber: 'TRACK-2024-001',
          shippedAt: new Date(),
        },
      },
      {
        userId: 'user_001',
        type: 'ORDER_SHIPPED',
        title: 'Đơn hàng đang được vận chuyển',
        content: 'Đơn hàng #ORD-2024-002 của bạn đang được vận chuyển. Mã vận đơn: TRACK-2024-002',
        read: false,
        metadata: {
          orderId: 'ORD-2024-002',
          trackingNumber: 'TRACK-2024-002',
          status: 'in_transit',
        },
      },
      // Promotion notifications
      {
        userId: 'user_001',
        type: 'PROMOTION',
        title: 'Khuyến mãi đặc biệt',
        content: 'Giảm 20% cho tất cả sản phẩm điện tử. Áp dụng đến hết ngày 31/12/2024',
        read: false,
        metadata: {
          promotionId: 'PROMO-2024-001',
          discount: 20,
          category: 'Electronics',
          validUntil: '2024-12-31',
        },
      },
      {
        userId: 'user_002',
        type: 'PROMOTION',
        title: 'Flash Sale',
        content: 'Flash Sale 50% cho đơn hàng đầu tiên. Chỉ còn 2 giờ!',
        read: false,
        metadata: {
          promotionId: 'PROMO-2024-002',
          discount: 50,
          type: 'flash_sale',
          validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        },
      },
      // Review reminders
      {
        userId: 'user_001',
        type: 'REVIEW_REMINDER',
        title: 'Nhắc nhở đánh giá',
        content: 'Bạn đã nhận được đơn hàng #ORD-2024-001. Hãy đánh giá sản phẩm để nhận điểm thưởng!',
        read: false,
        metadata: {
          orderId: 'ORD-2024-001',
          daysSinceDelivery: 3,
        },
      },
      // Account notifications
      {
        userId: 'user_001',
        type: 'ACCOUNT_UPDATE',
        title: 'Cập nhật tài khoản',
        content: 'Thông tin tài khoản của bạn đã được cập nhật thành công',
        read: true,
        metadata: {
          updateType: 'profile',
          updatedFields: ['email', 'phone'],
        },
      },
      {
        userId: 'user_002',
        type: 'ACCOUNT_UPDATE',
        title: 'Đổi mật khẩu thành công',
        content: 'Mật khẩu của bạn đã được thay đổi thành công. Nếu không phải bạn, vui lòng liên hệ hỗ trợ ngay.',
        read: false,
        metadata: {
          updateType: 'password',
          changedAt: new Date(),
        },
      },
    ];

    // Insert notifications
    const result = await NotificationModel.insertMany(notifications);
    console.log(`✅ Seeded ${result.length} notifications`);

    // Display summary
    const summary = await NotificationModel.aggregate([
      {
        $group: {
          _id: { userId: '$userId', read: '$read' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.userId': 1, '_id.read': 1 },
      },
    ]);

    console.log('\n📊 Notification Summary:');
    summary.forEach((item) => {
      console.log(
        `  User: ${item._id.userId}, Read: ${item._id.read ? 'Yes' : 'No'}, Count: ${item.count}`,
      );
    });

    const typeSummary = await NotificationModel.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    console.log('\n📋 Notification by Type:');
    typeSummary.forEach((item) => {
      console.log(`  ${item._id}: ${item.count}`);
    });

    console.log('\n🎉 Notification data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding notification data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();

