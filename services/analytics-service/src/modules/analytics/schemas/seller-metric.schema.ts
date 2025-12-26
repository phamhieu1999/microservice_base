import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SellerMetricDocument = SellerMetric & Document;

@Schema({ timestamps: true })
export class SellerMetric {
  @Prop({ required: true, index: true })
  sellerId: string;

  @Prop({ default: 0 })
  totalNetRevenue: number;

  @Prop({ default: 0 })
  totalCommission: number;

  @Prop({ default: 0 })
  totalPayout: number;
}

export const SellerMetricSchema = SchemaFactory.createForClass(SellerMetric);

SellerMetricSchema.index({ sellerId: 1 });
