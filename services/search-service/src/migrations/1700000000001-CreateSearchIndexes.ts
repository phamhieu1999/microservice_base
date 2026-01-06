import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { ProductIndex, ProductIndexSchema } from '../modules/search/schemas/product-index.schema';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function runMigration() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const connection = app.get<Connection>(getConnectionToken());
    
    // Get or create ProductIndex model
    const ProductIndexModel = connection.models[ProductIndex.name] || 
      connection.model(ProductIndex.name, ProductIndexSchema);

    console.log('🔄 Starting search indexes migration...');

    // Text index for full-text search
    try {
      await ProductIndexModel.collection.createIndex(
        { name: 'text', searchText: 'text' },
        { name: 'idx_search_text', background: true },
      );
      console.log('✅ Created text search index');
    } catch (error: any) {
      if (error.code !== 85) { // 85 = IndexOptionsConflict
        console.warn('⚠️  Text search index already exists or error:', error.message);
      }
    }

    // Index for category
    try {
      await ProductIndexModel.collection.createIndex(
        { category: 1 },
        { name: 'idx_search_category', background: true, sparse: true },
      );
      console.log('✅ Created category index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  Category index already exists or error:', error.message);
      }
    }

    // Index for brand
    try {
      await ProductIndexModel.collection.createIndex(
        { brand: 1 },
        { name: 'idx_search_brand', background: true, sparse: true },
      );
      console.log('✅ Created brand index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  Brand index already exists or error:', error.message);
      }
    }

    // Compound index for category and brand
    try {
      await ProductIndexModel.collection.createIndex(
        { category: 1, brand: 1 },
        { name: 'idx_search_category_brand', background: true },
      );
      console.log('✅ Created category_brand index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  Category_brand index already exists or error:', error.message);
      }
    }

    // Index for sellerId
    try {
      await ProductIndexModel.collection.createIndex(
        { sellerId: 1 },
        { name: 'idx_search_seller_id', background: true, sparse: true },
      );
      console.log('✅ Created sellerId index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  SellerId index already exists or error:', error.message);
      }
    }

    // Index for createdAt (descending for recent products)
    try {
      await ProductIndexModel.collection.createIndex(
        { createdAt: -1 },
        { name: 'idx_search_created_at', background: true },
      );
      console.log('✅ Created createdAt index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  CreatedAt index already exists or error:', error.message);
      }
    }

    // Index for price range queries
    try {
      await ProductIndexModel.collection.createIndex(
        { price: 1 },
        { name: 'idx_search_price', background: true },
      );
      console.log('✅ Created price index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  Price index already exists or error:', error.message);
      }
    }

    // Index for stock queries
    try {
      await ProductIndexModel.collection.createIndex(
        { stock: 1 },
        { name: 'idx_search_stock', background: true },
      );
      console.log('✅ Created stock index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  Stock index already exists or error:', error.message);
      }
    }

    // Compound index for category and createdAt
    try {
      await ProductIndexModel.collection.createIndex(
        { category: 1, createdAt: -1 },
        { name: 'idx_search_category_created', background: true },
      );
      console.log('✅ Created category_created index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  Category_created index already exists or error:', error.message);
      }
    }

    // Compound index for productId (unique)
    try {
      await ProductIndexModel.collection.createIndex(
        { productId: 1 },
        { name: 'idx_search_product_id', background: true, unique: true },
      );
      console.log('✅ Created productId unique index');
    } catch (error: any) {
      if (error.code !== 85) {
        console.warn('⚠️  ProductId index already exists or error:', error.message);
      }
    }

    console.log('✅ Search indexes migration completed successfully');
  } catch (error) {
    console.error('❌ Error running search migration:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runMigration();

