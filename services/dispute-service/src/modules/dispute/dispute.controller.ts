import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ReplyDisputeDto } from './dto/reply-dispute.dto';
import { EscalateDisputeDto } from './dto/escalate-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { Dispute } from '../../database/entities/dispute.entity';

@ApiTags('disputes')
@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new dispute' })
  @ApiBody({ type: CreateDisputeDto })
  @ApiCreatedResponse({
    description: 'Dispute created successfully',
    type: Dispute,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() body: CreateDisputeDto) {
    return this.disputeService.create(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute by id' })
  @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
  @ApiOkResponse({
    description: 'Dispute found',
    type: Dispute,
  })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  getById(@Param('id') id: string) {
    return this.disputeService.findById(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get disputes of user with pagination' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiOkResponse({
    description: 'List of disputes with pagination',
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/Dispute' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seller/support reply to dispute' })
  @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
  @ApiBody({ type: ReplyDisputeDto })
  @ApiOkResponse({
    description: 'Dispute replied successfully',
    type: Dispute,
  })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  reply(@Param('id') id: string, @Body() dto: ReplyDisputeDto) {
    return this.disputeService.sellerReply(id, dto.actorId, dto.message);
  }

  @Post(':id/escalate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Escalate dispute to customer support' })
  @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
  @ApiBody({ type: EscalateDisputeDto })
  @ApiOkResponse({
    description: 'Dispute escalated successfully',
    type: Dispute,
  })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  escalate(@Param('id') id: string, @Body() dto: EscalateDisputeDto) {
    return this.disputeService.escalate(id, dto.actorId, dto.reason);
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve dispute (admin only)' })
  @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
  @ApiBody({ type: ResolveDisputeDto })
  @ApiOkResponse({
    description: 'Dispute resolved successfully',
    type: Dispute,
  })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  resolve(@Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.disputeService.resolve(id, dto.actorId, dto.decision, dto.resolution);
  }
}
