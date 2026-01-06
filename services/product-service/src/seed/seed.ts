import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { Product, ProductSchema } from '../modules/product/schemas/product.schema';
import { Model } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const connection = app.get<Connection>(getConnectionToken());
    
    // Get or create Product model
    // Product extends Mongoose Document, nên dùng Model<typeof Product> là đủ
    const ProductModel = (connection.models[Product.name] ||
      connection.model(Product.name, ProductSchema)) as Model<typeof Product>;

    console.log('🌱 Starting product data seeding...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    const deleteResult = await ProductModel.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing products`);

    // Sample product data
    const products = [
      // Electronics
      {
        name: 'iPhone 15 Pro Max 256GB',
        description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, pin lâu dài',
        price: 32990000,
        stock: 50,
        category: 'Electronics',
        brand: 'Apple',
        sellerId: 'seller_001',
        lowStockThreshold: 10,
      },
      {
        name: 'Samsung Galaxy S24 Ultra 512GB',
        description: 'Galaxy S24 Ultra với S Pen, camera 200MP, màn hình Dynamic AMOLED 2X',
        price: 29990000,
        stock: 30,
        category: 'Electronics',
        brand: 'Samsung',
        sellerId: 'seller_001',
        lowStockThreshold: 10,
      },
      {
        name: 'MacBook Pro M3 14 inch',
        description: 'MacBook Pro với chip M3, 16GB RAM, 512GB SSD',
        price: 49990000,
        stock: 20,
        category: 'Electronics',
        brand: 'Apple',
        sellerId: 'seller_002',
        lowStockThreshold: 5,
      },
      {
        name: 'AirPods Pro 2',
        description: 'Tai nghe không dây với Active Noise Cancellation',
        price: 5990000,
        stock: 100,
        category: 'Electronics',
        brand: 'Apple',
        sellerId: 'seller_001',
        lowStockThreshold: 20,
      },
      {
        name: 'Sony WH-1000XM5',
        description: 'Tai nghe chống ồn hàng đầu với 30 giờ pin',
        price: 8990000,
        stock: 40,
        category: 'Electronics',
        brand: 'Sony',
        sellerId: 'seller_003',
        lowStockThreshold: 10,
      },
      // Clothing
      {
        name: 'Nike Air Max 90',
        description: 'Giày thể thao Nike Air Max 90 cổ điển',
        price: 3290000,
        stock: 75,
        category: 'Clothing',
        brand: 'Nike',
        sellerId: 'seller_004',
        lowStockThreshold: 15,
      },
      {
        name: 'Adidas Ultraboost 22',
        description: 'Giày chạy bộ với công nghệ Boost',
        price: 3990000,
        stock: 60,
        category: 'Clothing',
        brand: 'Adidas',
        sellerId: 'seller_004',
        lowStockThreshold: 15,
      },
      {
        name: 'Uniqlo Airism T-Shirt',
        description: 'Áo thun công nghệ Airism mát mẻ',
        price: 299000,
        stock: 200,
        category: 'Clothing',
        brand: 'Uniqlo',
        sellerId: 'seller_005',
        lowStockThreshold: 50,
      },
      {
        name: 'Levi\'s 501 Original Jeans',
        description: 'Quần jean cổ điển Levi\'s 501',
        price: 1990000,
        stock: 80,
        category: 'Clothing',
        brand: 'Levi\'s',
        sellerId: 'seller_005',
        lowStockThreshold: 20,
      },
      // Home & Garden
      {
        name: 'Dyson V15 Detect Vacuum',
        description: 'Máy hút bụi không dây với laser phát hiện bụi',
        price: 19990000,
        stock: 15,
        category: 'Home & Garden',
        brand: 'Dyson',
        sellerId: 'seller_006',
        lowStockThreshold: 5,
      },
      {
        name: 'Philips Hue Smart Light Starter Kit',
        description: 'Bộ đèn thông minh điều khiển qua app',
        price: 2990000,
        stock: 50,
        category: 'Home & Garden',
        brand: 'Philips',
        sellerId: 'seller_006',
        lowStockThreshold: 10,
      },
      {
        name: 'IKEA KALLAX Shelf Unit',
        description: 'Kệ sách 4 ngăn màu trắng',
        price: 1990000,
        stock: 30,
        category: 'Home & Garden',
        brand: 'IKEA',
        sellerId: 'seller_007',
        lowStockThreshold: 10,
      },
      // Food & Beverages
      {
        name: 'Nespresso Vertuo Coffee Machine',
        description: 'Máy pha cà phê tự động Nespresso Vertuo',
        price: 8990000,
        stock: 25,
        category: 'Food & Beverages',
        brand: 'Nespresso',
        sellerId: 'seller_008',
        lowStockThreshold: 5,
      },
      {
        name: 'KitchenAid Stand Mixer',
        description: 'Máy trộn bột KitchenAid 5.5L',
        price: 12990000,
        stock: 10,
        category: 'Food & Beverages',
        brand: 'KitchenAid',
        sellerId: 'seller_008',
        lowStockThreshold: 3,
      },
      // Books
      {
        name: 'The Lean Startup - Eric Ries',
        description: 'Sách về khởi nghiệp tinh gọn',
        price: 299000,
        stock: 150,
        category: 'Books',
        brand: 'Crown Business',
        sellerId: 'seller_009',
        lowStockThreshold: 30,
      },
      {
        name: 'Atomic Habits - James Clear',
        description: 'Sách về xây dựng thói quen tốt',
        price: 329000,
        stock: 120,
        category: 'Books',
        brand: 'Avery',
        sellerId: 'seller_009',
        lowStockThreshold: 30,
      },
      // Sports & Outdoors
      {
        name: 'Yoga Mat Premium',
        description: 'Thảm yoga cao cấp chống trượt',
        price: 599000,
        stock: 90,
        category: 'Sports & Outdoors',
        brand: 'Lululemon',
        sellerId: 'seller_010',
        lowStockThreshold: 20,
      },
      {
        name: 'Dumbbell Set 2x10kg',
        description: 'Bộ tạ tay 2 quả 10kg',
        price: 1299000,
        stock: 40,
        category: 'Sports & Outdoors',
        brand: 'ProForm',
        sellerId: 'seller_010',
        lowStockThreshold: 10,
      },
      // Beauty & Personal Care
      {
        name: 'La Mer Crème de la Mer',
        description: 'Kem dưỡng ẩm cao cấp La Mer',
        price: 8990000,
        stock: 20,
        category: 'Beauty & Personal Care',
        brand: 'La Mer',
        sellerId: 'seller_011',
        lowStockThreshold: 5,
      },
      {
        name: 'Dyson Supersonic Hair Dryer',
        description: 'Máy sấy tóc Dyson công nghệ ion',
        price: 12990000,
        stock: 15,
        category: 'Beauty & Personal Care',
        brand: 'Dyson',
        sellerId: 'seller_011',
        lowStockThreshold: 5,
      },
      // Toys & Games
      {
        name: 'LEGO Star Wars Millennium Falcon',
        description: 'Bộ LEGO Star Wars 75192 với 7541 mảnh',
        price: 8990000,
        stock: 12,
        category: 'Toys & Games',
        brand: 'LEGO',
        sellerId: 'seller_012',
        lowStockThreshold: 3,
      },
      {
        name: 'Nintendo Switch OLED',
        description: 'Máy chơi game Nintendo Switch OLED',
        price: 9990000,
        stock: 35,
        category: 'Toys & Games',
        brand: 'Nintendo',
        sellerId: 'seller_012',
        lowStockThreshold: 10,
      },
    ];

    // Insert products
    const result = await ProductModel.insertMany(products);
    console.log(`✅ Seeded ${result.length} products`);

    // Display summary by category
    const categorySummary = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Products by category:');
    Object.entries(categorySummary).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} products`);
    });

    console.log('\n🎉 Product data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding product data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();

