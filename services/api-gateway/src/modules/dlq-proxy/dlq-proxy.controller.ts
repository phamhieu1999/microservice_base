import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DLQProxyService } from './dlq-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('dlq')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dlq')
export class DLQProxyController {
  constructor(private readonly dlqService: DLQProxyService) {}

  @Get()
  @ApiOperation({
    summary: 'List failed messages',
    description: 'Lấy danh sách các message thất bại trong DLQ',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng records (default: 50, max: 100)',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Số lượng records bỏ qua (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách failed messages',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'DLQ service is temporarily unavailable' })
  listFailedMessages(
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.dlqService.listFailedMessages(
      limit ? parseInt(limit, 10) : undefined,
      skip ? parseInt(skip, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get failed message by ID',
    description: 'Lấy thông tin chi tiết của một failed message',
  })
  @ApiParam({ name: 'id', description: 'Failed message ID', type: String })
  @ApiResponse({ status: 200, description: 'Failed message details' })
  @ApiResponse({ status: 404, description: 'Failed message not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'DLQ service is temporarily unavailable' })
  getFailedMessage(@Param('id') id: string) {
    return this.dlqService.getFailedMessage(id);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry failed message',
    description: 'Thử lại xử lý một failed message',
  })
  @ApiParam({ name: 'id', description: 'Failed message ID', type: String })
  @ApiResponse({ status: 200, description: 'Retry initiated successfully' })
  @ApiResponse({ status: 404, description: 'Failed message not found' })
  @ApiResponse({ status: 400, description: 'Message is already being retried' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'DLQ service is temporarily unavailable' })
  retryFailedMessage(@Param('id') id: string) {
    return this.dlqService.retryFailedMessage(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete failed message',
    description: 'Xóa một failed message khỏi DLQ',
  })
  @ApiParam({ name: 'id', description: 'Failed message ID', type: String })
  @ApiResponse({ status: 200, description: 'Failed message deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'DLQ service is temporarily unavailable' })
  deleteFailedMessage(@Param('id') id: string) {
    return this.dlqService.deleteFailedMessage(id);
  }
}

