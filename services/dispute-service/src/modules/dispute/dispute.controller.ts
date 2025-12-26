import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ReplyDisputeDto } from './dto/reply-dispute.dto';
import { EscalateDisputeDto } from './dto/escalate-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@ApiTags('disputes')
@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a dispute' })
  create(@Body() body: CreateDisputeDto) {
    return this.disputeService.create(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute by id' })
  getById(@Param('id') id: string) {
    return this.disputeService.findById(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get disputes of user with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  getByUser(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.disputeService.findByUser(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Seller/support reply dispute' })
  reply(@Param('id') id: string, @Body() dto: ReplyDisputeDto) {
    return this.disputeService.sellerReply(id, dto.actorId, dto.message);
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Escalate dispute to CS' })
  escalate(@Param('id') id: string, @Body() dto: EscalateDisputeDto) {
    return this.disputeService.escalate(id, dto.actorId, dto.reason);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve dispute (admin)' })
  resolve(@Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.disputeService.resolve(id, dto.actorId, dto.decision, dto.resolution);
  }
}
