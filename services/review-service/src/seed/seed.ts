import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { Review, ReviewSchema } from '../modules/review/schemas/review.schema';
import { Model } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const connection = app.get<Connection>(getConnectionToken());

    // Get or create Review model
    const ReviewModel =
      (connection.models[Review.name] ||
        connection.model(Review.name, ReviewSchema)) as Model<Review>;

    console.log('🌱 Starting review data seeding...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    const deleteResult = await ReviewModel.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing reviews`);

    // Sample review data
    const reviews = [
      // Reviews for prod-001
      {
        productId: 'prod-001',
        userId: 'user-001',
        rating: 5,
        content: 'Sản phẩm tuyệt vời! Chất lượng tốt, giao hàng nhanh. Rất hài lòng!',
      },
      {
        productId: 'prod-001',
        userId: 'user-002',
        rating: 4,
        content: 'Sản phẩm tốt, đúng như mô tả. Đóng gói cẩn thận.',
      },
      {
        productId: 'prod-001',
        userId: 'user-003',
        rating: 5,
        content: 'Rất hài lòng với sản phẩm này. Sẽ mua lại!',
      },
      {
        productId: 'prod-001',
        userId: 'user-004',
        rating: 3,
        content: 'Sản phẩm ổn, nhưng có thể tốt hơn.',
      },
      {
        productId: 'prod-001',
        userId: 'user-005',
        rating: 5,
        content: 'Tuyệt vời! Vượt mong đợi.',
      },
      // Reviews for prod-002
      {
        productId: 'prod-002',
        userId: 'user-001',
        rating: 4,
        content: 'Sản phẩm tốt, giá hợp lý.',
      },
      {
        productId: 'prod-002',
        userId: 'user-006',
        rating: 5,
        content: 'Chất lượng tốt, đáng tiền.',
      },
      {
        productId: 'prod-002',
        userId: 'user-007',
        rating: 2,
        content: 'Không như mong đợi, chất lượng kém hơn.',
      },
      // Reviews for prod-003
      {
        productId: 'prod-003',
        userId: 'user-002',
        rating: 5,
        content: 'Sản phẩm cao cấp, rất đẹp và chất lượng.',
      },
      {
        productId: 'prod-003',
        userId: 'user-003',
        rating: 4,
        content: 'Tốt, nhưng giá hơi cao.',
      },
      {
        productId: 'prod-003',
        userId: 'user-008',
        rating: 5,
        content: 'Tuyệt vời! Đúng như hình ảnh.',
      },
      {
        productId: 'prod-003',
        userId: 'user-009',
        rating: 4,
        content: 'Sản phẩm tốt, giao hàng nhanh.',
      },
      // Reviews for prod-004
      {
        productId: 'prod-004',
        userId: 'user-001',
        rating: 3,
        content: 'Sản phẩm ổn, không có gì đặc biệt.',
      },
      {
        productId: 'prod-004',
        userId: 'user-010',
        rating: 4,
        content: 'Tốt, đáng mua.',
      },
      {
        productId: 'prod-004',
        userId: 'user-011',
        rating: 5,
        content: 'Rất hài lòng!',
      },
      // Reviews for prod-005
      {
        productId: 'prod-005',
        userId: 'user-002',
        rating: 5,
        content: 'Sản phẩm chất lượng cao, rất đáng mua!',
      },
      {
        productId: 'prod-005',
        userId: 'user-012',
        rating: 4,
        content: 'Tốt, nhưng có thể cải thiện thêm.',
      },
      {
        productId: 'prod-005',
        userId: 'user-013',
        rating: 5,
        content: 'Tuyệt vời! Sẽ mua lại.',
      },
      {
        productId: 'prod-005',
        userId: 'user-014',
        rating: 1,
        content: 'Không hài lòng, sản phẩm lỗi.',
      },
      // Reviews for prod-006
      {
        productId: 'prod-006',
        userId: 'user-003',
        rating: 4,
        content: 'Sản phẩm tốt, giá cả hợp lý.',
      },
      {
        productId: 'prod-006',
        userId: 'user-015',
        rating: 5,
        content: 'Rất hài lòng với chất lượng.',
      },
      // Reviews for prod-007
      {
        productId: 'prod-007',
        userId: 'user-004',
        rating: 5,
        content: 'Sản phẩm cao cấp, đáng giá.',
      },
      {
        productId: 'prod-007',
        userId: 'user-016',
        rating: 4,
        content: 'Tốt, nhưng cần cải thiện đóng gói.',
      },
      {
        productId: 'prod-007',
        userId: 'user-017',
        rating: 5,
        content: 'Tuyệt vời! Vượt mong đợi.',
      },
      // Reviews for prod-008
      {
        productId: 'prod-008',
        userId: 'user-005',
        rating: 3,
        content: 'Sản phẩm ổn, không có gì nổi bật.',
      },
      {
        productId: 'prod-008',
        userId: 'user-018',
        rating: 4,
        content: 'Tốt, đáng mua.',
      },
      // Reviews for prod-009
      {
        productId: 'prod-009',
        userId: 'user-006',
        rating: 5,
        content: 'Sản phẩm chất lượng, rất hài lòng!',
      },
      {
        productId: 'prod-009',
        userId: 'user-019',
        rating: 4,
        content: 'Tốt, nhưng giá hơi cao.',
      },
      {
        productId: 'prod-009',
        userId: 'user-020',
        rating: 5,
        content: 'Tuyệt vời! Đúng như mô tả.',
      },
      // Reviews for prod-010
      {
        productId: 'prod-010',
        userId: 'user-007',
        rating: 4,
        content: 'Sản phẩm tốt, giao hàng nhanh.',
      },
      {
        productId: 'prod-010',
        userId: 'user-021',
        rating: 5,
        content: 'Rất hài lòng! Sẽ mua lại.',
      },
      {
        productId: 'prod-010',
        userId: 'user-022',
        rating: 3,
        content: 'Sản phẩm ổn, không có gì đặc biệt.',
      },
      // Reviews without content (rating only)
      {
        productId: 'prod-011',
        userId: 'user-001',
        rating: 5,
      },
      {
        productId: 'prod-011',
        userId: 'user-002',
        rating: 4,
      },
      {
        productId: 'prod-012',
        userId: 'user-003',
        rating: 5,
      },
      {
        productId: 'prod-012',
        userId: 'user-004',
        rating: 3,
      },
      {
        productId: 'prod-012',
        userId: 'user-005',
        rating: 4,
      },
    ];

    // Insert reviews
    const result = await ReviewModel.insertMany(reviews);
    console.log(`✅ Seeded ${result.length} reviews`);

    // Display summary
    const totalReviews = reviews.length;
    const avgRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    const ratingDistribution = {
      1: reviews.filter((r) => r.rating === 1).length,
      2: reviews.filter((r) => r.rating === 2).length,
      3: reviews.filter((r) => r.rating === 3).length,
      4: reviews.filter((r) => r.rating === 4).length,
      5: reviews.filter((r) => r.rating === 5).length,
    };

    // Group by product
    const reviewsByProduct: Record<string, number> = {};
    reviews.forEach((review) => {
      reviewsByProduct[review.productId] =
        (reviewsByProduct[review.productId] || 0) + 1;
    });

    // Group by user
    const reviewsByUser: Record<string, number> = {};
    reviews.forEach((review) => {
      reviewsByUser[review.userId] = (reviewsByUser[review.userId] || 0) + 1;
    });

    console.log('\n📊 Review Summary:');
    console.log(`   Total reviews: ${totalReviews}`);
    console.log(`   Average rating: ${avgRating.toFixed(2)}`);
    console.log(`   Rating distribution:`);
    console.log(`     5 stars: ${ratingDistribution[5]}`);
    console.log(`     4 stars: ${ratingDistribution[4]}`);
    console.log(`     3 stars: ${ratingDistribution[3]}`);
    console.log(`     2 stars: ${ratingDistribution[2]}`);
    console.log(`     1 star: ${ratingDistribution[1]}`);
    console.log(`   Unique products: ${Object.keys(reviewsByProduct).length}`);
    console.log(`   Unique users: ${Object.keys(reviewsByUser).length}`);

    console.log('\n📦 Reviews by product:');
    Object.entries(reviewsByProduct)
      .sort((a, b) => b[1] - a[1])
      .forEach(([productId, count]) => {
        console.log(`   ${productId}: ${count} reviews`);
      });

    console.log('\n👤 Top reviewers:');
    Object.entries(reviewsByUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([userId, count]) => {
        console.log(`   ${userId}: ${count} reviews`);
      });

    console.log('\n🎉 Review data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding review data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();

