import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserMetricDocument = UserMetric & Document;

@Schema({ timestamps: true })
export class UserMetric {
  @Prop({ required: true, index: true })
  date: Date; // YYYY-MM-DD format

  @Prop({ required: true, default: 0 })
  dailyActiveUsers: number; // DAU

  @Prop({ required: true, default: 0 })
  monthlyActiveUsers: number; // MAU

  @Prop({ required: true, default: 0 })
  newUsers: number;

  @Prop({ default: 0 })
  retentionRate: number; // Percentage
}

export const UserMetricSchema = SchemaFactory.createForClass(UserMetric);

UserMetricSchema.index({ date: 1 });

