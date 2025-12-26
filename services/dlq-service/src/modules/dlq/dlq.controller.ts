import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DLQService } from './dlq.service';

@ApiTags('dlq')
@Controller('dlq')
export class DLQController {
  constructor(private readonly dlqService: DLQService) {}

  @Get()
  @ApiOperation({ summary: 'List failed messages' })
  @ApiResponse({ status: 200, description: 'List of failed messages' })
  async listFailedMessages(
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.dlqService.listFailedMessages(
      limit ? parseInt(limit, 10) : 50,
      skip ? parseInt(skip, 10) : 0,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get failed message by ID' })
  @ApiResponse({ status: 200, description: 'Failed message details' })
  @ApiResponse({ status: 404, description: 'Failed message not found' })
  async getFailedMessage(@Param('id') id: string) {
    return this.dlqService.getFailedMessage(id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry failed message' })
  @ApiResponse({ status: 200, description: 'Retry initiated' })
  @ApiResponse({ status: 404, description: 'Failed message not found' })
  async retryFailedMessage(@Param('id') id: string) {
    return this.dlqService.retryFailedMessage(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete failed message' })
  @ApiResponse({ status: 200, description: 'Failed message deleted' })
  async deleteFailedMessage(@Param('id') id: string) {
    return this.dlqService.deleteFailedMessage(id);
  }
}

