import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RevenueMetricDocument = RevenueMetric & Document;

@Schema({ timestamps: true })
export class RevenueMetric {
  @Prop({ required: true, index: true })
  date: Date; // YYYY-MM-DD format

  @Prop({ required: true, default: 0 })
  revenue: number; // Total revenue in VND

  @Prop({ required: true, default: 0 })
  orderCount: number;

  @Prop({ required: true, default: 0 })
  averageOrderValue: number;

  @Prop({ default: 'daily' })
  period: 'daily' | 'weekly' | 'monthly';
}

export const RevenueMetricSchema = SchemaFactory.createForClass(RevenueMetric);

// Indexes for efficient queries
RevenueMetricSchema.index({ date: 1, period: 1 });

