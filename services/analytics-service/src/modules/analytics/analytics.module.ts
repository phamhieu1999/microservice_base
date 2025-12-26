import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RevenueMetric, RevenueMetricSchema } from './schemas/revenue-metric.schema';
import { ProductMetric, ProductMetricSchema } from './schemas/product-metric.schema';
import { UserMetric, UserMetricSchema } from './schemas/user-metric.schema';
import { SellerMetric, SellerMetricSchema } from './schemas/seller-metric.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RevenueMetric.name, schema: RevenueMetricSchema },
      { name: ProductMetric.name, schema: ProductMetricSchema },
      { name: UserMetric.name, schema: UserMetricSchema },
      { name: SellerMetric.name, schema: SellerMetricSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

