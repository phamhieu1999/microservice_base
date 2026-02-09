import { ApiProperty } from '@nestjs/swagger';

export class FailedMessageResponseDto {
  @ApiProperty({ description: 'Failed message ID' })
  _id: string;

  @ApiProperty({ description: 'Original Kafka topic' })
  originalTopic: string;

  @ApiProperty({ description: 'Original partition' })
  originalPartition: number;

  @ApiProperty({ description: 'Original offset' })
  originalOffset: string;

  @ApiProperty({ description: 'Original message key', required: false })
  originalKey?: string;

  @ApiProperty({ description: 'Original message value' })
  originalValue: any;

  @ApiProperty({ description: 'Error message' })
  error: string;

  @ApiProperty({ description: 'Timestamp when message failed' })
  timestamp: Date;

  @ApiProperty({ description: 'Number of retry attempts' })
  retryCount: number;

  @ApiProperty({
    description: 'Current status',
    enum: ['PENDING', 'RETRYING', 'RESOLVED', 'IGNORED', 'FAILED_PERMANENT'],
  })
  status: string;

  @ApiProperty({ description: 'Date when retried', required: false })
  retriedAt?: Date;

  @ApiProperty({ description: 'Date when resolved', required: false })
  resolvedAt?: Date;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

