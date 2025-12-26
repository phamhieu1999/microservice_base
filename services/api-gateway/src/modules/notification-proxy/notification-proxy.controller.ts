import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationProxyService } from './notification-proxy.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationProxyController {
  constructor(private readonly service: NotificationProxyService) {}

  @Get()
  listMyNotifications(@Req() req: any) {
    return this.service.forwardList(req.headers.authorization);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    return this.service.forwardUnreadCount(req.headers.authorization);
  }

  @Post(':id/read')
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.service.forwardMarkAsRead(req.headers.authorization, id);
  }
}

