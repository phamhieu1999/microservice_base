import { Controller, Get, Post, Delete, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DLQService } from './dlq.service';
import { ListQueryDto } from './dto/list-query.dto';
import { FailedMessageResponseDto } from './dto/failed-message-response.dto';
import { RetryResponseDto } from './dto/retry-response.dto';
import { DeleteResponseDto } from './dto/delete-response.dto';

@ApiTags('dlq')
@Controller('dlq')
export class DLQController {
  constructor(private readonly dlqService: DLQService) {}

  @Get()
  @ApiOperation({ summary: 'List failed messages' })
  @ApiResponse({
    status: 200,
    description: 'List of failed messages',
    type: [FailedMessageResponseDto],
  })
  async listFailedMessages(@Query() query: ListQueryDto) {
    return this.dlqService.listFailedMessages(query.limit || 50, query.skip || 0);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get failed message by ID' })
  @ApiParam({ name: 'id', description: 'Failed message ID' })
  @ApiResponse({
    status: 200,
    description: 'Failed message details',
    type: FailedMessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Failed message not found' })
  async getFailedMessage(@Param('id') id: string) {
    const message = await this.dlqService.getFailedMessage(id);
    if (!message) {
      throw new HttpException('Failed message not found', HttpStatus.NOT_FOUND);
    }
    return message;
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry failed message' })
  @ApiParam({ name: 'id', description: 'Failed message ID' })
  @ApiResponse({
    status: 200,
    description: 'Retry initiated',
    type: RetryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Failed message not found' })
  @ApiResponse({ status: 400, description: 'Message is already being retried' })
  async retryFailedMessage(@Param('id') id: string): Promise<RetryResponseDto> {
    try {
      return await this.dlqService.retryFailedMessage(id);
    } catch (error) {
      if (error.message === 'Failed message not found') {
        throw new HttpException('Failed message not found', HttpStatus.NOT_FOUND);
      }
      if (error.message === 'Message is already being retried') {
        throw new HttpException('Message is already being retried', HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete failed message' })
  @ApiParam({ name: 'id', description: 'Failed message ID' })
  @ApiResponse({
    status: 200,
    description: 'Failed message deleted',
    type: DeleteResponseDto,
  })
  async deleteFailedMessage(@Param('id') id: string): Promise<DeleteResponseDto> {
    return this.dlqService.deleteFailedMessage(id);
  }
}

