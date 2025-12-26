import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DisputeService } from './dispute.service';

@ApiTags('disputes-admin')
@Controller('disputes')
export class DisputeAdminController {
  constructor(private readonly disputeService: DisputeService) {}

  @Get()
  @ApiOperation({ summary: 'Admin list disputes with filters & paging' })
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
