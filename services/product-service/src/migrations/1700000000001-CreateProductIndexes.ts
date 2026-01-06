import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { Product, ProductSchema } from '../modules/product/schemas/product.schema';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function runMigration() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const connection = app.get<Connection>(getConnectionToken());
    
    // Get or create Product model
    const ProductModel = connection.models[Product.name] || 
      connection.model(Product.name, ProductSchema);

    console.log('🔄 Starting product indexes migration...');

    // Text index for full-text search
    try {
      await ProductModel.collection.createIndex(
        { name: 'text', description: 'text' },
        { name: 'idx_product_text_search', background: true },
      );
      console.log('✅ Created text search index');
    } catch (error: any) {
      if (error.code !== 85) { // 85 = IndexOptionsConflict
        console.warn('⚠️  Text search index already exists or error:', error.message);
      }
    }

    // Index for sellerId (already defined in schema, but ensure it exists)
    try {
      await ProductModel.collection.createIndex(
        { sellerId: 1 },
        { name: 'idx_product_sellerId', background: true, sparse: true },
      );
      console.log('✅ Created sellerId index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  SellerId index already exists or error:', error.message);
      }
    }

    // Compound index for category and brand
    try {
      await ProductModel.collection.createIndex(
        { category: 1, brand: 1 },
        { name: 'idx_product_category_brand', background: true },
      );
      console.log('✅ Created category_brand index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  Category_brand index already exists or error:', error.message);
      }
    }

    // Index for createdAt (descending for recent products)
    try {
      await ProductModel.collection.createIndex(
        { createdAt: -1 },
        { name: 'idx_product_created_at', background: true },
      );
      console.log('✅ Created createdAt index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  CreatedAt index already exists or error:', error.message);
      }
    }

    // Index for price range queries
    try {
      await ProductModel.collection.createIndex(
        { price: 1 },
        { name: 'idx_product_price', background: true },
      );
      console.log('✅ Created price index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  Price index already exists or error:', error.message);
      }
    }

    // Compound index for category and createdAt
    try {
      await ProductModel.collection.createIndex(
        { category: 1, createdAt: -1 },
        { name: 'idx_product_category_created', background: true },
      );
      console.log('✅ Created category_created index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  Category_created index already exists or error:', error.message);
      }
    }

    // Index for stock queries (for inventory management)
    try {
      await ProductModel.collection.createIndex(
        { stock: 1 },
        { name: 'idx_product_stock', background: true },
      );
      console.log('✅ Created stock index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  Stock index already exists or error:', error.message);
      }
    }

    // Compound index for low stock alerts
    try {
      await ProductModel.collection.createIndex(
        { stock: 1, lowStockThreshold: 1 },
        { name: 'idx_product_low_stock', background: true, sparse: true },
      );
      console.log('✅ Created low stock index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  Low stock index already exists or error:', error.message);
      }
    }

    console.log('✅ Product indexes migration completed successfully');
  } catch (error) {
    console.error('❌ Error running product migration:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runMigration();

