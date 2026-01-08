import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { DisputeProxyService } from './dispute-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('disputes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('disputes')
export class DisputeProxyController {
  constructor(private readonly disputeService: DisputeProxyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new dispute',
    description: 'Tạo dispute mới cho đơn hàng',
  })
  @ApiBody({
    description: 'Thông tin dispute',
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', example: 'order-123' },
        userId: { type: 'string', example: 'user-456' },
        sellerId: { type: 'string', example: 'seller-789' },
        reasonCode: { type: 'string', example: 'DAMAGED_ITEM' },
        description: { type: 'string', example: 'Sản phẩm bị hư hỏng' },
        attachments: { type: 'object', example: { images: ['image1.jpg'] } },
      },
      required: ['orderId', 'userId', 'sellerId', 'reasonCode'],
    },
  })
  @ApiResponse({ status: 201, description: 'Dispute created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Dispute service is temporarily unavailable' })
  createDispute(@Req() req: any, @Body() body: any) {
    return this.disputeService.createDispute(body);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get dispute by id',
    description: 'Lấy thông tin dispute theo ID',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
  @ApiResponse({ status: 200, description: 'Dispute found' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Dispute service is temporarily unavailable' })
  getDisputeById(@Param('id') id: string) {
    return this.disputeService.getDisputeById(id);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get disputes of user with pagination',
    description: 'Lấy danh sách disputes của user với phân trang',
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'List of disputes with pagination' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Dispute service is temporarily unavailable' })
  getDisputesByUser(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.disputeService.getDisputesByUser(
      userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Post(':id/reply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seller/support reply to dispute',
    description: 'Seller hoặc support phản hồi dispute',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
  @ApiBody({
    description: 'Thông tin phản hồi',
    schema: {
      type: 'object',
      properties: {
        actorId: { type: 'string', example: 'seller-789' },
        message: { type: 'string', example: 'Chúng tôi sẽ kiểm tra và phản hồi sớm' },
      },
      required: ['actorId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Dispute replied successfully' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Dispute service is temporarily unavailable' })
  replyToDispute(@Param('id') id: string, @Body() body: any) {
    return this.disputeService.replyToDispute(id, body);
  }

  @Post(':id/escalate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Escalate dispute to customer support',
    description: 'Escalate dispute lên customer support',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
  @ApiBody({
    description: 'Thông tin escalate',
    schema: {
      type: 'object',
      properties: {
        actorId: { type: 'string', example: 'user-456' },
        reason: { type: 'string', example: 'Cần hỗ trợ từ CS' },
      },
      required: ['actorId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Dispute escalated successfully' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Dispute service is temporarily unavailable' })
  escalateDispute(@Param('id') id: string, @Body() body: any) {
    return this.disputeService.escalateDispute(id, body);
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve dispute (admin only)',
    description: 'Admin giải quyết dispute',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
  @ApiBody({
    description: 'Thông tin quyết định',
    schema: {
      type: 'object',
      properties: {
        actorId: { type: 'string', example: 'admin-001' },
        decision: { type: 'string', enum: ['RESOLVED', 'REJECTED'], example: 'RESOLVED' },
        resolution: { type: 'string', example: 'Đã hoàn tiền 100% cho khách hàng' },
      },
      required: ['actorId', 'decision'],
    },
  })
  @ApiResponse({ status: 200, description: 'Dispute resolved successfully' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Dispute service is temporarily unavailable' })
  resolveDispute(@Param('id') id: string, @Body() body: any) {
    return this.disputeService.resolveDispute(id, body);
  }
}

