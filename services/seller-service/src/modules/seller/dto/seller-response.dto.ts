import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SellerStatus } from '../../../database/entities/seller.entity';

export class ShopResponseDto {
  @ApiProperty({ description: 'Shop UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ description: 'Shop name', example: 'Tech Store' })
  name!: string;

  @ApiPropertyOptional({ description: 'Shop avatar URL', example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Shop address', example: '123 Main Street' })
  address?: string;

  @ApiProperty({ description: 'Seller ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  sellerId!: string;

  @ApiProperty({ description: 'Creation date', example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;
}

export class SellerResponseDto {
  @ApiProperty({ description: 'Seller UUID', example: '123e4567-e89b-12d3-a456-426614174001' })
  id!: string;

  @ApiProperty({ description: 'User ID', example: 'user-123' })
  userId!: string;

  @ApiProperty({ description: 'Seller status', enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'APPROVED' })
  status!: SellerStatus;

  @ApiProperty({ description: 'Creation date', example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiPropertyOptional({ description: 'List of shops', type: [ShopResponseDto] })
  shops?: ShopResponseDto[];
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'List of items', isArray: true })
  data!: T[];

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total!: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages', example: 10 })
  totalPages!: number;
}

