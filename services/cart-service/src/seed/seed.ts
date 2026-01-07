import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { Cart, CartSchema } from '../modules/cart/schemas/cart.schema';
import { Model } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const connection = app.get<Connection>(getConnectionToken());

    // Get or create Cart model
    const CartModel =
      (connection.models[Cart.name] ||
        connection.model(Cart.name, CartSchema)) as Model<Cart>;

    console.log('🌱 Starting cart data seeding...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    const deleteResult = await CartModel.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing carts`);

    // Sample cart data
    const carts = [
      {
        userId: '2cece589-a7e4-4203-9955-6a5ab04eeacd', // admin user from auth-service seed
        items: [
          {
            productId: 'prod-001',
            quantity: 2,
            price: 649500,
          },
          {
            productId: 'prod-002',
            quantity: 1,
            price: 299000,
          },
          {
            productId: 'prod-003',
            quantity: 1,
            price: 2499000,
          },
        ],
      },
      {
        userId: 'user_001', // from notification seed
        items: [
          {
            productId: 'prod-004',
            quantity: 3,
            price: 899000,
          },
          {
            productId: 'prod-005',
            quantity: 1,
            price: 1199000,
          },
        ],
      },
      {
        userId: 'user_002', // from notification seed
        items: [
          {
            productId: 'prod-006',
            quantity: 2,
            price: 949500,
          },
          {
            productId: 'prod-007',
            quantity: 1,
            price: 2149500,
          },
          {
            productId: 'prod-008',
            quantity: 1,
            price: 5990000,
          },
        ],
      },
      {
        userId: 'user_003',
        items: [
          {
            productId: 'prod-009',
            quantity: 1,
            price: 3290000,
          },
        ],
      },
      {
        userId: 'user_004',
        items: [
          {
            productId: 'prod-010',
            quantity: 5,
            price: 299000,
          },
          {
            productId: 'prod-011',
            quantity: 2,
            price: 1990000,
          },
        ],
      },
      {
        userId: 'user_005',
        items: [], // Empty cart
      },
      {
        userId: 'user_006',
        items: [
          {
            productId: 'prod-012',
            quantity: 1,
            price: 8990000,
          },
          {
            productId: 'prod-013',
            quantity: 1,
            price: 12990000,
          },
          {
            productId: 'prod-014',
            quantity: 2,
            price: 599000,
          },
        ],
      },
      {
        userId: 'user_007',
        items: [
          {
            productId: 'prod-015',
            quantity: 1,
            price: 8990000,
          },
        ],
      },
    ];

    // Insert carts
    const result = await CartModel.insertMany(carts);
    console.log(`✅ Seeded ${result.length} carts`);

    // Display summary
    const totalItems = carts.reduce(
      (sum, cart) => sum + cart.items.length,
      0,
    );
    const totalValue = carts.reduce((sum, cart) => {
      const cartValue = cart.items.reduce(
        (itemSum, item) => itemSum + item.price * item.quantity,
        0,
      );
      return sum + cartValue;
    }, 0);

    console.log('\n📊 Cart Summary:');
    console.log(`   Total carts: ${carts.length}`);
    console.log(`   Total items: ${totalItems}`);
    console.log(`   Total value: ${totalValue.toLocaleString('vi-VN')} VNĐ`);
    console.log(`   Empty carts: ${carts.filter((c) => c.items.length === 0).length}`);
    console.log(`   Carts with items: ${carts.filter((c) => c.items.length > 0).length}`);

    // Display carts by user
    console.log('\n🛒 Carts by user:');
    carts.forEach((cart) => {
      const cartValue = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      console.log(
        `   User ${cart.userId}: ${cart.items.length} items, ${cartValue.toLocaleString('vi-VN')} VNĐ`,
      );
    });

    console.log('\n🎉 Cart data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding cart data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();

