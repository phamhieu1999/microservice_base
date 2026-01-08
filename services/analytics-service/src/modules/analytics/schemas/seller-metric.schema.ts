import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SellerMetricDocument = SellerMetric & Document;

@Schema({ timestamps: true })
export class SellerMetric {
  @Prop({ required: true })
  sellerId: string;

  @Prop({ default: 0 })
  totalNetRevenue: number;

  @Prop({ default: 0 })
  totalCommission: number;

  @Prop({ default: 0 })
  totalPayout: number;
}

export const SellerMetricSchema = SchemaFactory.createForClass(SellerMetric);

// Indexes are created via migration script for better control
