import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Review, ReviewSchema } from '../modules/review/schemas/review.schema';
import { createReviewIndexes } from '../database/indexes';

async function migrate() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🔄 Starting review service migration...');

    const connection = app.get<Connection>(getConnectionToken());

    // Get or create Review model
    const ReviewModel =
      connection.models[Review.name] ||
      connection.model(Review.name, ReviewSchema);

    console.log('📊 Creating indexes...');
    await createReviewIndexes(ReviewModel);

    // List all indexes
    const indexes = await ReviewModel.collection.indexes();
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

