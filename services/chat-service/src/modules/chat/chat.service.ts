import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation } from './schemas/conversation.schema';
import { Message } from './schemas/message.schema';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly convModel: Model<Conversation>,
    @InjectModel(Message.name)
    private readonly msgModel: Model<Message>,
  ) {}

  async getOrCreateConversation(buyerId: string, sellerId: string) {
    let conv = await this.convModel.findOne({ buyerId, sellerId }).exec();
    if (!conv) {
      conv = await this.convModel.create({ buyerId, sellerId });
    }
    return conv;
  }

  listConversations(userId: string) {
    return this.convModel
      .find({ $or: [{ buyerId: userId }, { sellerId: userId }] })
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  async sendMessage(senderId: string, conversationId: string, dto: SendMessageDto) {
    const msg = await this.msgModel.create({
      conversationId,
      senderId,
      content: dto.content,
      type: dto.type || 'TEXT',
    });
    await this.convModel.updateOne(
      { _id: conversationId },
      { lastMessageAt: new Date() },
    );
    return msg;
  }

  listMessages(conversationId: string) {
    return this.msgModel
      .find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }
}


