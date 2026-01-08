import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FailedMessageDocument = FailedMessage & Document;

@Schema({ timestamps: true })
export class FailedMessage {
  @Prop({ required: true })
  originalTopic: string;

  @Prop({ required: true })
  originalPartition: number;

  @Prop({ required: true })
  originalOffset: string;

  @Prop()
  originalKey?: string;

  @Prop({ type: Object })
  originalValue: any;

  @Prop({ required: true })
  error: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  retryCount: number;

  @Prop({ default: 'PENDING' })
  status: 'PENDING' | 'RETRYING' | 'RESOLVED' | 'IGNORED' | 'FAILED_PERMANENT';

  @Prop()
  retriedAt?: Date;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  lastError?: string;
}

export const FailedMessageSchema = SchemaFactory.createForClass(FailedMessage);

