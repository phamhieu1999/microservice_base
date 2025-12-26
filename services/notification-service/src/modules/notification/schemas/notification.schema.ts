import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  type: string; // 'ORDER_CREATED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'MESSAGE_RECEIVED'

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>; // orderId, paymentId, etc.
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

