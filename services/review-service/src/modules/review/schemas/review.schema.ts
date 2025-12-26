import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop({ required: true, index: true })
  productId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  content?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);


