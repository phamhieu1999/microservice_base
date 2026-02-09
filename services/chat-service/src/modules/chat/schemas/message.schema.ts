import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ required: true })
  conversationId!: string;

  @Prop({ required: true })
  senderId!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true, default: 'TEXT' })
  type!: 'TEXT' | 'IMAGE';
}

export const MessageSchema = SchemaFactory.createForClass(Message);


