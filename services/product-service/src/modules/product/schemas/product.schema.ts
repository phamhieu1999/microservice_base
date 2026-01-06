import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  stock!: number;

  @Prop()
  category?: string;

  @Prop()
  brand?: string;

  @Prop({ required: false, index: true })
  sellerId?: string;

  @Prop({ default: 10 })
  lowStockThreshold?: number; // Alert khi stock < threshold này
}

export const ProductSchema = SchemaFactory.createForClass(Product);


