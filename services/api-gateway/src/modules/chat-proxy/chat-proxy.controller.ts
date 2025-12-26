import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ChatProxyService } from './chat-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class ChatProxyController {
  constructor(private readonly service: ChatProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('conversations')
  createConv(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.createConversation(authHeader, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  listConversations(@Req() req: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.listConversations(authHeader);
  }

  @UseGuards(JwtAuthGuard)
  @Post('conversations/:id/messages')
  sendMessage(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.sendMessage(authHeader, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations/:id/messages')
  listMessages(@Req() req: any, @Param('id') id: string) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.listMessages(authHeader, id);
  }
}


