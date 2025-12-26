import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductMetricDocument = ProductMetric & Document;

@Schema({ timestamps: true })
export class ProductMetric {
  @Prop({ required: true, index: true })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, default: 0 })
  salesCount: number;

  @Prop({ required: true, default: 0 })
  revenue: number;

  @Prop({ required: true, default: 0 })
  views: number;

  @Prop({ default: 0 })
  conversionRate: number; // (salesCount / views) * 100

  @Prop({ index: true })
  category?: string;

  @Prop({ index: true })
  sellerId?: string;
}

export const ProductMetricSchema = SchemaFactory.createForClass(ProductMetric);

ProductMetricSchema.index({ salesCount: -1 });
ProductMetricSchema.index({ revenue: -1 });
ProductMetricSchema.index({ sellerId: 1 });

