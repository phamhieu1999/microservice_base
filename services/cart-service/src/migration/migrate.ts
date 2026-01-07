import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Cart, CartSchema } from '../modules/cart/schemas/cart.schema';
import { createCartIndexes } from '../database/indexes';

async function migrate() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🔄 Starting cart service migration...');

    const connection = app.get<Connection>(getConnectionToken());

    // Get or create Cart model
    const CartModel =
      connection.models[Cart.name] ||
      connection.model(Cart.name, CartSchema);

    console.log('📊 Creating indexes...');
    await createCartIndexes(CartModel);

    // List all indexes
    const indexes = await CartModel.collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach((index: any) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

migrate();

