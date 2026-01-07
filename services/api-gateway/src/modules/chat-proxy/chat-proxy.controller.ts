import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ChatProxyService } from './chat-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('chat')
@ApiBearerAuth()
@Controller()
export class ChatProxyController {
  constructor(private readonly service: ChatProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('conversations')
  @ApiOperation({ summary: 'Tạo cuộc hội thoại mới (buyer - seller)' })
  @ApiBody({ description: 'Thông tin người tham gia, nội dung tin nhắn đầu tiên, ...' })
  createConv(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.createConversation(authHeader, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  @ApiOperation({ summary: 'Danh sách các cuộc hội thoại của user hiện tại' })
  listConversations(@Req() req: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.listConversations(authHeader);
  }

  @UseGuards(JwtAuthGuard)
  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn trong một cuộc hội thoại' })
  @ApiParam({ name: 'id', description: 'ID cuộc hội thoại' })
  @ApiBody({ description: 'Nội dung tin nhắn' })
  sendMessage(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.sendMessage(authHeader, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Danh sách tin nhắn trong một cuộc hội thoại' })
  @ApiParam({ name: 'id', description: 'ID cuộc hội thoại' })
  listMessages(@Req() req: any, @Param('id') id: string) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.listMessages(authHeader, id);
  }
}


