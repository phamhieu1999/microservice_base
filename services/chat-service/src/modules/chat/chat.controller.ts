import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

// Lưu ý: Auth (JWT) đã được Gateway xử lý, ở đây chỉ tin tưởng header/x-user-id nếu được forward.
@Controller()
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Post('conversations')
  createConv(@Req() req: any, @Body() body: CreateConversationDto) {
    const userId = req.user?.userId || req.user?.sub || req.headers['x-user-id'];
    return this.service.getOrCreateConversation(userId, body.sellerId);
  }

  @Get('conversations')
  listMyConversations(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub || req.headers['x-user-id'];
    return this.service.listConversations(userId);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: SendMessageDto,
  ) {
    const userId = req.user?.userId || req.user?.sub || req.headers['x-user-id'];
    return this.service.sendMessage(userId, id, body);
  }

  @Get('conversations/:id/messages')
  listMessages(@Param('id') id: string) {
    return this.service.listMessages(id);
  }
}


