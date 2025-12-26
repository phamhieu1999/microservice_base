import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductIndexDocument = ProductIndex & Document;

@Schema({ timestamps: true })
export class ProductIndex extends Document {
  @Prop({ required: true, unique: true })
  productId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  stock: number;

  @Prop()
  category?: string;

  @Prop()
  brand?: string;

  @Prop()
  sellerId?: string;

  // Text search field: combine name, description, category, brand
  @Prop({ type: String })
  searchText?: string;
}

export const ProductIndexSchema = SchemaFactory.createForClass(ProductIndex);

// Tạo text index cho full-text search
ProductIndexSchema.index({ searchText: 'text', name: 'text' });

