import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Notification type', example: 'ORDER_CREATED' })
  type!: string;

  @ApiProperty({ description: 'Notification title' })
  title!: string;

  @ApiProperty({ description: 'Notification content' })
  content!: string;

  @ApiProperty({ description: 'Read status' })
  read!: boolean;

  @ApiProperty({ description: 'Additional metadata', required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt!: Date;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto], description: 'List of notifications' })
  items!: NotificationResponseDto[];

  @ApiProperty({ description: 'Total number of notifications' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;
}

export class UnreadCountResponseDto {
  @ApiProperty({ description: 'Number of unread notifications' })
  count!: number;
}

export class MarkAsReadResponseDto {
  @ApiProperty({ description: 'Update result' })
  acknowledged!: boolean;

  @ApiProperty({ description: 'Number of modified documents' })
  modifiedCount!: number;

  @ApiProperty({ description: 'Number of matched documents' })
  matchedCount!: number;
}

