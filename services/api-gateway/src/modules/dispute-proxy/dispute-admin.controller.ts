import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { DisputeProxyService } from './dispute-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('disputes-admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin/disputes')
export class DisputeAdminController {
  constructor(private readonly disputeService: DisputeProxyService) {}

  @Get()
  @ApiOperation({
    summary: 'Admin list disputes with filters & paging',
    description: 'Admin lấy danh sách disputes với filters và phân trang',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'SELLER_RESPONDED', 'ESCALATED', 'RESOLVED', 'REJECTED'], description: 'Filter by status' })
  @ApiQuery({ name: 'sellerId', required: false, type: String, description: 'Filter by seller ID' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'List of disputes with filters and pagination' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Dispute service is temporarily unavailable' })
  listDisputes(
    @Query('status') status?: string,
    @Query('sellerId') sellerId?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.disputeService.listDisputes({
      status,
      sellerId,
      userId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}

