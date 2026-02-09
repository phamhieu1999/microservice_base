import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationProxyService } from './notification-proxy.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationProxyController {
  constructor(private readonly service: NotificationProxyService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách thông báo của user hiện tại' })
  listMyNotifications(@Req() req: any) {
    return this.service.forwardList(req.headers.authorization);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Số lượng thông báo chưa đọc' })
  getUnreadCount(@Req() req: any) {
    return this.service.forwardUnreadCount(req.headers.authorization);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Đánh dấu một thông báo là đã đọc' })
  @ApiParam({ name: 'id', description: 'ID thông báo' })
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.service.forwardMarkAsRead(req.headers.authorization, id);
  }
}

