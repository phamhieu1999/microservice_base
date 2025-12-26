import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FailedMessage, FailedMessageSchema } from './schemas/failed-message.schema';
import { DLQService } from './dlq.service';
import { DLQController } from './dlq.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FailedMessage.name, schema: FailedMessageSchema }]),
  ],
  controllers: [DLQController],
  providers: [DLQService],
  exports: [DLQService],
})
export class DLQModule {}

