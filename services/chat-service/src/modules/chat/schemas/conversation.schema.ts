import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Conversation extends Document {
  @Prop({ required: true })
  buyerId!: string;

  @Prop({ required: true })
  sellerId!: string;

  @Prop({ type: Date, default: null })
  lastMessageAt?: Date | null;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);


