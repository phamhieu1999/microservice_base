import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { DataSource } from 'typeorm';
import { Order, OrderStatus } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { OrderHistory } from '../database/entities/order-history.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const orderRepo = dataSource.getRepository(Order);
    const orderItemRepo = dataSource.getRepository(OrderItem);
    const orderHistoryRepo = dataSource.getRepository(OrderHistory);

    console.log('🌱 Starting order data seeding...');

    // Clear existing data
    // Dùng TRUNCATE ... CASCADE để xử lý quan hệ FK giữa orders, order_items, order_history
    await dataSource.query(
      'TRUNCATE TABLE "order_history", "order_items", "orders" RESTART IDENTITY CASCADE;',
    );
    console.log('🗑️  Cleared existing orders, order items and history (TRUNCATE CASCADE)');

    // Sample orders data
    const orders = [
      {
        userId: '2cece589-a7e4-4203-9955-6a5ab04eeacd', // admin user from auth-service seed
        orderGroupId: 'GRP-2024-001',
        voucherId: 'VOUCHER-001',
        discountAmount: 50000,
        shippingFee: 30000,
        totalAmount: 1329000,
        status: 'PAID' as const,
        trackingNumber: 'TRACK-2024-001',
        shippedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        userId: '2cece589-a7e4-4203-9955-6a5ab04eeacd',
        orderGroupId: 'GRP-2024-002',
        voucherId: undefined,
        discountAmount: 0,
        shippingFee: 25000,
        totalAmount: 2499000,
        status: 'SHIPPED' as const,
        trackingNumber: 'TRACK-2024-002',
        shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        userId: '2cece589-a7e4-4203-9955-6a5ab04eeacd',
        orderGroupId: undefined,
        voucherId: undefined,
        discountAmount: 0,
        shippingFee: 20000,
        totalAmount: 899000,
        status: 'PENDING' as const,
      },
      {
        userId: 'user_001', // from notification seed
        orderGroupId: 'GRP-2024-003',
        voucherId: 'VOUCHER-002',
        discountAmount: 100000,
        shippingFee: 35000,
        totalAmount: 3599000,
        status: 'DELIVERED' as const,
        trackingNumber: 'TRACK-2024-003',
        shippedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        userId: 'user_001',
        orderGroupId: undefined,
        voucherId: undefined,
        discountAmount: 0,
        shippingFee: 30000,
        totalAmount: 1899000,
        status: 'PROCESSING' as const,
      },
      {
        userId: 'user_002', // from notification seed
        orderGroupId: 'GRP-2024-004',
        voucherId: undefined,
        discountAmount: 0,
        shippingFee: 40000,
        totalAmount: 4299000,
        status: 'OUT_FOR_DELIVERY' as const,
        trackingNumber: 'TRACK-2024-004',
        shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    // Insert orders
    const savedOrders = await orderRepo.save(orders);
    console.log(`✅ Seeded ${savedOrders.length} orders`);

    // Sample order items
    const orderItems = [
      // Order 1 items
      {
        order: savedOrders[0],
        productId: 'prod-001',
        sellerId: 'seller-001',
        quantity: 2,
        unitPrice: 649500,
      },
      {
        order: savedOrders[0],
        productId: 'prod-002',
        sellerId: 'seller-001',
        quantity: 1,
        unitPrice: 299000,
      },
      // Order 2 items
      {
        order: savedOrders[1],
        productId: 'prod-003',
        sellerId: 'seller-002',
        quantity: 1,
        unitPrice: 2499000,
      },
      // Order 3 items
      {
        order: savedOrders[2],
        productId: 'prod-004',
        sellerId: 'seller-003',
        quantity: 1,
        unitPrice: 899000,
      },
      // Order 4 items
      {
        order: savedOrders[3],
        productId: 'prod-005',
        sellerId: 'seller-001',
        quantity: 3,
        unitPrice: 1199000,
      },
      // Order 5 items
      {
        order: savedOrders[4],
        productId: 'prod-006',
        sellerId: 'seller-002',
        quantity: 2,
        unitPrice: 949500,
      },
      // Order 6 items
      {
        order: savedOrders[5],
        productId: 'prod-007',
        sellerId: 'seller-003',
        quantity: 2,
        unitPrice: 2149500,
      },
    ];

    const savedItems = await orderItemRepo.save(orderItems);
    console.log(`✅ Seeded ${savedItems.length} order items`);

    // Sample order history
    const orderHistories = [
      {
        order: savedOrders[0],
        orderId: savedOrders[0].id,
        status: 'PENDING' as OrderStatus,
        changedBy: 'system',
        note: 'Order created',
      },
      {
        order: savedOrders[0],
        orderId: savedOrders[0].id,
        status: 'PAID' as OrderStatus,
        changedBy: 'system',
        note: 'Payment received',
      },
      {
        order: savedOrders[1],
        orderId: savedOrders[1].id,
        status: 'PENDING' as OrderStatus,
        changedBy: 'system',
        note: 'Order created',
      },
      {
        order: savedOrders[1],
        orderId: savedOrders[1].id,
        status: 'PAID' as OrderStatus,
        changedBy: 'system',
        note: 'Payment received',
      },
      {
        order: savedOrders[1],
        orderId: savedOrders[1].id,
        status: 'PROCESSING' as OrderStatus,
        changedBy: 'admin',
        note: 'Order confirmed, preparing shipment',
      },
      {
        order: savedOrders[1],
        orderId: savedOrders[1].id,
        status: 'SHIPPED' as OrderStatus,
        changedBy: 'admin',
        note: 'Order shipped',
      },
      {
        order: savedOrders[3],
        orderId: savedOrders[3].id,
        status: 'PENDING' as OrderStatus,
        changedBy: 'system',
        note: 'Order created',
      },
      {
        order: savedOrders[3],
        orderId: savedOrders[3].id,
        status: 'PAID' as OrderStatus,
        changedBy: 'system',
        note: 'Payment received',
      },
      {
        order: savedOrders[3],
        orderId: savedOrders[3].id,
        status: 'PROCESSING' as OrderStatus,
        changedBy: 'admin',
        note: 'Order confirmed',
      },
      {
        order: savedOrders[3],
        orderId: savedOrders[3].id,
        status: 'SHIPPED' as OrderStatus,
        changedBy: 'admin',
        note: 'Order shipped',
      },
      {
        order: savedOrders[3],
        orderId: savedOrders[3].id,
        status: 'DELIVERED' as OrderStatus,
        changedBy: 'system',
        note: 'Order delivered successfully',
      },
    ];

    const savedHistories = await orderHistoryRepo.save(orderHistories);
    console.log(`✅ Seeded ${savedHistories.length} order history records`);

    // Display summary
    const summary = await orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    console.log('\n📊 Order Summary by Status:');
    summary.forEach((item) => {
      console.log(`  ${item.status}: ${item.count}`);
    });

    const userSummary = await orderRepo
      .createQueryBuilder('order')
      .select('order.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.userId')
      .getRawMany();

    console.log('\n👤 Order Summary by User:');
    userSummary.forEach((item) => {
      console.log(`  User: ${item.userId}, Orders: ${item.count}`);
    });

    console.log('\n🎉 Order data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding order data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();

