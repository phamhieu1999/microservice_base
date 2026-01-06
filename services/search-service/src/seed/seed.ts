import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { ProductIndex, ProductIndexSchema } from '../modules/search/schemas/product-index.schema';
import { Model } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const connection = app.get<Connection>(getConnectionToken());
    
    // Get or create ProductIndex model
    const ProductIndexModel = (connection.models[ProductIndex.name] ||
      connection.model(ProductIndex.name, ProductIndexSchema)) as Model<ProductIndex>;

    console.log('🌱 Starting search data seeding...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    const deleteResult = await ProductIndexModel.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing product indexes`);

    // Sample product index data (for search service)
    const productIndexes = [
      // Electronics
      {
        productId: 'prod_001',
        name: 'iPhone 15 Pro Max 256GB',
        description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, pin lâu dài',
        price: 32990000,
        stock: 50,
        category: 'Electronics',
        brand: 'Apple',
        sellerId: 'seller_001',
        searchText: 'iPhone 15 Pro Max 256GB iPhone 15 Pro Max với chip A17 Pro, camera 48MP, pin lâu dài Electronics Apple',
      },
      {
        productId: 'prod_002',
        name: 'Samsung Galaxy S24 Ultra 512GB',
        description: 'Galaxy S24 Ultra với S Pen, camera 200MP, màn hình Dynamic AMOLED 2X',
        price: 29990000,
        stock: 30,
        category: 'Electronics',
        brand: 'Samsung',
        sellerId: 'seller_001',
        searchText: 'Samsung Galaxy S24 Ultra 512GB Galaxy S24 Ultra với S Pen, camera 200MP, màn hình Dynamic AMOLED 2X Electronics Samsung',
      },
      {
        productId: 'prod_003',
        name: 'MacBook Pro M3 14 inch',
        description: 'MacBook Pro với chip M3, 16GB RAM, 512GB SSD',
        price: 49990000,
        stock: 20,
        category: 'Electronics',
        brand: 'Apple',
        sellerId: 'seller_002',
        searchText: 'MacBook Pro M3 14 inch MacBook Pro với chip M3, 16GB RAM, 512GB SSD Electronics Apple',
      },
      {
        productId: 'prod_004',
        name: 'AirPods Pro 2',
        description: 'Tai nghe không dây với Active Noise Cancellation',
        price: 5990000,
        stock: 100,
        category: 'Electronics',
        brand: 'Apple',
        sellerId: 'seller_001',
        searchText: 'AirPods Pro 2 Tai nghe không dây với Active Noise Cancellation Electronics Apple',
      },
      {
        productId: 'prod_005',
        name: 'Sony WH-1000XM5',
        description: 'Tai nghe chống ồn hàng đầu với 30 giờ pin',
        price: 8990000,
        stock: 40,
        category: 'Electronics',
        brand: 'Sony',
        sellerId: 'seller_003',
        searchText: 'Sony WH-1000XM5 Tai nghe chống ồn hàng đầu với 30 giờ pin Electronics Sony',
      },
      // Clothing
      {
        productId: 'prod_006',
        name: 'Nike Air Max 90',
        description: 'Giày thể thao Nike Air Max 90 cổ điển',
        price: 3290000,
        stock: 75,
        category: 'Clothing',
        brand: 'Nike',
        sellerId: 'seller_004',
        searchText: 'Nike Air Max 90 Giày thể thao Nike Air Max 90 cổ điển Clothing Nike',
      },
      {
        productId: 'prod_007',
        name: 'Adidas Ultraboost 22',
        description: 'Giày chạy bộ với công nghệ Boost',
        price: 3990000,
        stock: 60,
        category: 'Clothing',
        brand: 'Adidas',
        sellerId: 'seller_004',
        searchText: 'Adidas Ultraboost 22 Giày chạy bộ với công nghệ Boost Clothing Adidas',
      },
      {
        productId: 'prod_008',
        name: 'Uniqlo Airism T-Shirt',
        description: 'Áo thun công nghệ Airism mát mẻ',
        price: 299000,
        stock: 200,
        category: 'Clothing',
        brand: 'Uniqlo',
        sellerId: 'seller_005',
        searchText: 'Uniqlo Airism T-Shirt Áo thun công nghệ Airism mát mẻ Clothing Uniqlo',
      },
      {
        productId: 'prod_009',
        name: 'Levi\'s 501 Original Jeans',
        description: 'Quần jean cổ điển Levi\'s 501',
        price: 1990000,
        stock: 80,
        category: 'Clothing',
        brand: 'Levi\'s',
        sellerId: 'seller_005',
        searchText: 'Levi\'s 501 Original Jeans Quần jean cổ điển Levi\'s 501 Clothing Levi\'s',
      },
      // Home & Garden
      {
        productId: 'prod_010',
        name: 'Dyson V15 Detect Vacuum',
        description: 'Máy hút bụi không dây với laser phát hiện bụi',
        price: 19990000,
        stock: 15,
        category: 'Home & Garden',
        brand: 'Dyson',
        sellerId: 'seller_006',
        searchText: 'Dyson V15 Detect Vacuum Máy hút bụi không dây với laser phát hiện bụi Home & Garden Dyson',
      },
      {
        productId: 'prod_011',
        name: 'Philips Hue Smart Light Starter Kit',
        description: 'Bộ đèn thông minh điều khiển qua app',
        price: 2990000,
        stock: 50,
        category: 'Home & Garden',
        brand: 'Philips',
        sellerId: 'seller_006',
        searchText: 'Philips Hue Smart Light Starter Kit Bộ đèn thông minh điều khiển qua app Home & Garden Philips',
      },
      {
        productId: 'prod_012',
        name: 'IKEA KALLAX Shelf Unit',
        description: 'Kệ sách 4 ngăn màu trắng',
        price: 1990000,
        stock: 30,
        category: 'Home & Garden',
        brand: 'IKEA',
        sellerId: 'seller_007',
        searchText: 'IKEA KALLAX Shelf Unit Kệ sách 4 ngăn màu trắng Home & Garden IKEA',
      },
      // Food & Beverages
      {
        productId: 'prod_013',
        name: 'Nespresso Vertuo Coffee Machine',
        description: 'Máy pha cà phê tự động Nespresso Vertuo',
        price: 8990000,
        stock: 25,
        category: 'Food & Beverages',
        brand: 'Nespresso',
        sellerId: 'seller_008',
        searchText: 'Nespresso Vertuo Coffee Machine Máy pha cà phê tự động Nespresso Vertuo Food & Beverages Nespresso',
      },
      {
        productId: 'prod_014',
        name: 'KitchenAid Stand Mixer',
        description: 'Máy trộn bột KitchenAid 5.5L',
        price: 12990000,
        stock: 10,
        category: 'Food & Beverages',
        brand: 'KitchenAid',
        sellerId: 'seller_008',
        searchText: 'KitchenAid Stand Mixer Máy trộn bột KitchenAid 5.5L Food & Beverages KitchenAid',
      },
      // Books
      {
        productId: 'prod_015',
        name: 'The Lean Startup - Eric Ries',
        description: 'Sách về khởi nghiệp tinh gọn',
        price: 299000,
        stock: 150,
        category: 'Books',
        brand: 'Crown Business',
        sellerId: 'seller_009',
        searchText: 'The Lean Startup - Eric Ries Sách về khởi nghiệp tinh gọn Books Crown Business',
      },
      {
        productId: 'prod_016',
        name: 'Atomic Habits - James Clear',
        description: 'Sách về xây dựng thói quen tốt',
        price: 329000,
        stock: 120,
        category: 'Books',
        brand: 'Avery',
        sellerId: 'seller_009',
        searchText: 'Atomic Habits - James Clear Sách về xây dựng thói quen tốt Books Avery',
      },
      // Sports & Outdoors
      {
        productId: 'prod_017',
        name: 'Yoga Mat Premium',
        description: 'Thảm yoga cao cấp chống trượt',
        price: 599000,
        stock: 90,
        category: 'Sports & Outdoors',
        brand: 'Lululemon',
        sellerId: 'seller_010',
        searchText: 'Yoga Mat Premium Thảm yoga cao cấp chống trượt Sports & Outdoors Lululemon',
      },
      {
        productId: 'prod_018',
        name: 'Dumbbell Set 2x10kg',
        description: 'Bộ tạ tay 2 quả 10kg',
        price: 1299000,
        stock: 40,
        category: 'Sports & Outdoors',
        brand: 'ProForm',
        sellerId: 'seller_010',
        searchText: 'Dumbbell Set 2x10kg Bộ tạ tay 2 quả 10kg Sports & Outdoors ProForm',
      },
      // Beauty & Personal Care
      {
        productId: 'prod_019',
        name: 'La Mer Crème de la Mer',
        description: 'Kem dưỡng ẩm cao cấp La Mer',
        price: 8990000,
        stock: 20,
        category: 'Beauty & Personal Care',
        brand: 'La Mer',
        sellerId: 'seller_011',
        searchText: 'La Mer Crème de la Mer Kem dưỡng ẩm cao cấp La Mer Beauty & Personal Care La Mer',
      },
      {
        productId: 'prod_020',
        name: 'Dyson Supersonic Hair Dryer',
        description: 'Máy sấy tóc Dyson công nghệ ion',
        price: 12990000,
        stock: 15,
        category: 'Beauty & Personal Care',
        brand: 'Dyson',
        sellerId: 'seller_011',
        searchText: 'Dyson Supersonic Hair Dryer Máy sấy tóc Dyson công nghệ ion Beauty & Personal Care Dyson',
      },
      // Toys & Games
      {
        productId: 'prod_021',
        name: 'LEGO Star Wars Millennium Falcon',
        description: 'Bộ LEGO Star Wars 75192 với 7541 mảnh',
        price: 8990000,
        stock: 12,
        category: 'Toys & Games',
        brand: 'LEGO',
        sellerId: 'seller_012',
        searchText: 'LEGO Star Wars Millennium Falcon Bộ LEGO Star Wars 75192 với 7541 mảnh Toys & Games LEGO',
      },
      {
        productId: 'prod_022',
        name: 'Nintendo Switch OLED',
        description: 'Máy chơi game Nintendo Switch OLED',
        price: 9990000,
        stock: 35,
        category: 'Toys & Games',
        brand: 'Nintendo',
        sellerId: 'seller_012',
        searchText: 'Nintendo Switch OLED Máy chơi game Nintendo Switch OLED Toys & Games Nintendo',
      },
    ];

    // Insert product indexes
    const result = await ProductIndexModel.insertMany(productIndexes);
    console.log(`✅ Seeded ${result.length} product indexes`);

    // Display summary by category
    const categorySummary = productIndexes.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Product indexes by category:');
    Object.entries(categorySummary).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} products`);
    });

    // Display summary by brand
    const brandSummary = productIndexes.reduce((acc, product) => {
      if (product.brand) {
        acc[product.brand] = (acc[product.brand] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Product indexes by brand:');
    Object.entries(brandSummary).forEach(([brand, count]) => {
      console.log(`   ${brand}: ${count} products`);
    });

    console.log('\n🎉 Search data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding search data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();

