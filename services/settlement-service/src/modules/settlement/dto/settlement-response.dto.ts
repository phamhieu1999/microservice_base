import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayoutStatus } from '../../../database/entities/payout-request.entity';

export class SellerBalanceResponseDto {
  @ApiProperty({ 
    description: 'Balance UUID', 
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String 
  })
  id!: string;

  @ApiProperty({ 
    description: 'Seller ID', 
    example: 'seller-1',
    type: String 
  })
  sellerId!: string;

  @ApiProperty({ 
    description: 'Available amount that can be withdrawn (VND)', 
    example: 5000000,
    type: Number 
  })
  availableAmount!: number;

  @ApiProperty({ 
    description: 'Pending amount in payout requests (VND)', 
    example: 500000,
    type: Number 
  })
  pendingAmount!: number;
}

export class PayoutRequestResponseDto {
  @ApiProperty({ 
    description: 'Payout request UUID', 
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String 
  })
  id!: string;

  @ApiProperty({ 
    description: 'Seller ID who requested the payout', 
    example: 'seller-1',
    type: String 
  })
  sellerId!: string;

  @ApiProperty({ 
    description: 'Payout amount in VND', 
    example: 1000000,
    type: Number 
  })
  amount!: number;

  @ApiProperty({ 
    description: 'Payout status: REQUESTED (pending approval), APPROVED (approved but not paid), PAID (completed), REJECTED (rejected)', 
    enum: ['REQUESTED', 'APPROVED', 'PAID', 'REJECTED'], 
    example: 'REQUESTED',
    type: String 
  })
  status!: PayoutStatus;

  @ApiPropertyOptional({ 
    description: 'Optional note for the payout request', 
    example: 'Monthly payout request',
    type: String 
  })
  note?: string;

  @ApiProperty({ 
    description: 'Creation timestamp', 
    example: '2024-01-01T00:00:00.000Z',
    type: Date 
  })
  createdAt!: Date;

  @ApiProperty({ 
    description: 'Last update timestamp', 
    example: '2024-01-01T00:00:00.000Z',
    type: Date 
  })
  updatedAt!: Date;
}

export class PayoutRequestWithBalanceResponseDto {
  @ApiProperty({ description: 'Updated seller balance', type: SellerBalanceResponseDto })
  balance!: SellerBalanceResponseDto;

  @ApiProperty({ description: 'Created payout request', type: PayoutRequestResponseDto })
  payout!: PayoutRequestResponseDto;
}

export class PaginatedPayoutResponseDto {
  @ApiProperty({ 
    description: 'List of payout requests', 
    type: [PayoutRequestResponseDto],
    isArray: true 
  })
  items!: PayoutRequestResponseDto[];

  @ApiProperty({ 
    description: 'Total number of payout requests matching the filter', 
    example: 100,
    type: Number 
  })
  total!: number;

  @ApiProperty({ 
    description: 'Current page number (1-indexed)', 
    example: 1,
    type: Number 
  })
  page!: number;

  @ApiProperty({ 
    description: 'Number of items per page', 
    example: 20,
    type: Number 
  })
  limit!: number;
}

export class CommissionConfigResponseDto {
  @ApiProperty({ 
    description: 'Commission configuration UUID', 
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String 
  })
  id!: string;

  @ApiPropertyOptional({ 
    description: 'Seller ID if this commission is specific to a seller (null for global/category configs)', 
    example: 'seller-1',
    type: String 
  })
  sellerId?: string;

  @ApiPropertyOptional({ 
    description: 'Category ID if this commission is specific to a category (null for global/seller configs)', 
    example: 'electronics',
    type: String 
  })
  categoryId?: string;

  @ApiProperty({ 
    description: 'Commission rate as decimal (0.15 = 15%, 0.1 = 10%). Range: 0.0 to 1.0', 
    example: 0.15,
    type: Number,
    minimum: 0,
    maximum: 1 
  })
  commissionRate!: number;
}

export class PaymentSettlementResponseDto {
  @ApiProperty({ description: 'Updated seller balance', type: SellerBalanceResponseDto })
  balance!: SellerBalanceResponseDto;

  @ApiProperty({ description: 'Gross amount (before commission)', example: 1000000 })
  grossAmount!: number;

  @ApiProperty({ description: 'Commission amount', example: 150000 })
  commission!: number;

  @ApiProperty({ description: 'Net amount (after commission)', example: 850000 })
  net!: number;
}

