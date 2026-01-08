import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { DisputeService } from './dispute.service';
import { Dispute } from '../../database/entities/dispute.entity';

@ApiTags('disputes-admin')
@Controller('admin/disputes')
export class DisputeAdminController {
  constructor(private readonly disputeService: DisputeService) {}

  @Get()
  @ApiOperation({ summary: 'Admin list disputes with filters & paging' })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'SELLER_RESPONDED', 'ESCALATED', 'RESOLVED', 'REJECTED'], description: 'Filter by status' })
  @ApiQuery({ name: 'sellerId', required: false, type: String, description: 'Filter by seller ID' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiOkResponse({
    description: 'List of disputes with filters and pagination',
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/Dispute' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async list(
    @Query('status') status?: string,
    @Query('sellerId') sellerId?: string,
    @Query('userId') userId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 20;
    const { items, total } = await this.disputeService.listWithFilters({
      status,
      sellerId,
      userId,
      page: p,
      limit: l,
    });
    return { items, page: p, limit: l, total };
  }
}
