import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  NotificationListResponseDto,
  UnreadCountResponseDto,
  MarkAsReadResponseDto,
} from './dto/notification-response.dto';

@ApiTags('notifications')
@Controller('notifications')
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth('JWT-auth')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of notifications for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'List of notifications', type: NotificationListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  listMyNotifications(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listByUser(
      req.user.userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications for current user' })
  @ApiResponse({ status: 200, description: 'Unread count', type: UnreadCountResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUnreadCount(@Req() req: any) {
    return this.service.getUnreadCount(req.user.userId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read', type: MarkAsReadResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.service.markAsRead(id, req.user.userId);
  }
}

