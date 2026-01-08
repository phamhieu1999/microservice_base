import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductMetricDocument = ProductMetric & Document;

@Schema({ timestamps: true })
export class ProductMetric {
  @Prop({ required: true })
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

  @Prop()
  category?: string;

  @Prop()
  sellerId?: string;
}

export const ProductMetricSchema = SchemaFactory.createForClass(ProductMetric);

// Indexes are created via migration script for better control

