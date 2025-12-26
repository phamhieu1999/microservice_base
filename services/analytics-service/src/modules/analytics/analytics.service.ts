import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RevenueMetric, RevenueMetricDocument } from './schemas/revenue-metric.schema';
import { ProductMetric, ProductMetricDocument } from './schemas/product-metric.schema';
import { UserMetric, UserMetricDocument } from './schemas/user-metric.schema';
import { SellerMetric, SellerMetricDocument } from './schemas/seller-metric.schema';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(RevenueMetric.name)
    private readonly revenueModel: Model<RevenueMetricDocument>,
    @InjectModel(ProductMetric.name)
    private readonly productModel: Model<ProductMetricDocument>,
    @InjectModel(UserMetric.name)
    private readonly userModel: Model<UserMetricDocument>,
    @InjectModel(SellerMetric.name)
    private readonly sellerModel: Model<SellerMetricDocument>,
    @Optional() private readonly cache?: CacheService,
  ) {}

  // Revenue Analytics
  async getRevenueByPeriod(startDate: Date, endDate: Date, period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    return this.revenueModel
      .find({
        date: { $gte: startDate, $lte: endDate },
        period,
      })
      .select('date period revenue orderCount averageOrderValue')
      .sort({ date: 1 })
      .lean()
      .exec();
  }

  async getTotalRevenue(startDate: Date, endDate: Date) {
    const metrics = await this.revenueModel
      .find({
        date: { $gte: startDate, $lte: endDate },
      })
      .select('revenue orderCount averageOrderValue')
      .lean()
      .exec();

    return {
      totalRevenue: metrics.reduce((sum, m) => sum + m.revenue, 0),
      totalOrders: metrics.reduce((sum, m) => sum + m.orderCount, 0),
      averageOrderValue: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.averageOrderValue, 0) / metrics.length
        : 0,
    };
  }

  // Product Analytics
  async getTopProducts(limit = 10, sortBy: 'sales' | 'revenue' = 'sales') {
    const cacheKey = `analytics:top-products:${limit}:${sortBy}`;
    return this.cache?.getOrSet(
      cacheKey,
      async () => {
        const sortField = sortBy === 'sales' ? 'salesCount' : 'revenue';
        return this.productModel
          .find()
          .select('productId productName category sellerId salesCount revenue conversionRate')
          .sort({ [sortField]: -1 })
          .limit(limit)
          .lean()
          .exec();
      },
      300, // 5 minutes TTL
    ) || (async () => {
      const sortField = sortBy === 'sales' ? 'salesCount' : 'revenue';
      return this.productModel
        .find()
        .select('productId productName category sellerId salesCount revenue conversionRate')
        .sort({ [sortField]: -1 })
        .limit(limit)
        .lean()
        .exec();
    })();
  }

  async getProductMetrics(productId: string) {
    return this.productModel
      .findOne({ productId })
      .select('productId productName category sellerId salesCount revenue views conversionRate')
      .lean()
      .exec();
  }

  async getProductsByCategory(category: string, limit = 10) {
    return this.productModel
      .find({ category })
      .select('productId productName category sellerId salesCount revenue')
      .sort({ salesCount: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async getProductsBySeller(sellerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.productModel
        .find({ sellerId })
        .select('productId productName category salesCount revenue conversionRate')
        .sort({ salesCount: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments({ sellerId }).exec(),
    ]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // User Analytics
  async getUserMetrics(startDate: Date, endDate: Date) {
    return this.userModel
      .find({
        date: { $gte: startDate, $lte: endDate },
      })
      .select('date dailyActiveUsers monthlyActiveUsers newUsers')
      .sort({ date: 1 })
      .lean()
      .exec();
  }

  async getDAU(date: Date) {
    const metric = await this.userModel.findOne({ date }).exec();
    return metric?.dailyActiveUsers || 0;
  }

  async getMAU(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const metrics = await this.userModel
      .find({
        date: { $gte: startDate, $lte: endDate },
      })
      .exec();
    return metrics.length > 0 ? metrics[metrics.length - 1].monthlyActiveUsers : 0;
  }

  // Aggregate methods (called by Kafka consumers)
  async aggregateRevenue(date: Date, revenue: number, orderCount: number) {
    const dateStr = date.toISOString().split('T')[0];
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

    await this.revenueModel.findOneAndUpdate(
      { date: new Date(dateStr), period: 'daily' },
      {
        date: new Date(dateStr),
        revenue: { $inc: revenue },
        orderCount: { $inc: orderCount },
        averageOrderValue: avgOrderValue,
        period: 'daily',
      },
      { upsert: true },
    );
  }

  async aggregateProduct(productId: string, productName: string, revenue: number, category?: string, sellerId?: string) {
    await this.productModel.findOneAndUpdate(
      { productId },
      {
        productId,
        productName,
        $inc: { salesCount: 1, revenue },
        category,
        sellerId,
      },
      { upsert: true },
    );

    // Update conversion rate
    const product = await this.productModel.findOne({ productId }).exec();
    if (product && product.views > 0) {
      product.conversionRate = (product.salesCount / product.views) * 100;
      await product.save();
    }
  }

  async aggregateUser(date: Date, isNewUser: boolean) {
    const dateStr = date.toISOString().split('T')[0];
    await this.userModel.findOneAndUpdate(
      { date: new Date(dateStr) },
      {
        date: new Date(dateStr),
        $inc: { dailyActiveUsers: 1, ...(isNewUser && { newUsers: 1 }) },
      },
      { upsert: true },
    );
  }

  // Seller settlement analytics
  async aggregateSellerSettlement(sellerId: string, net: number, commission: number) {
    await this.sellerModel.findOneAndUpdate(
      { sellerId },
      {
        sellerId,
        $inc: { totalNetRevenue: net, totalCommission: commission },
      },
      { upsert: true },
    );
  }

  async aggregateSellerPayout(sellerId: string, amount: number) {
    await this.sellerModel.findOneAndUpdate(
      { sellerId },
      {
        sellerId,
        $inc: { totalPayout: amount },
      },
      { upsert: true },
    );
  }
}

