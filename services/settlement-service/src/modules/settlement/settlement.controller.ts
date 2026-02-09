import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementService } from './settlement.service';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { UpdatePayoutStatusDto } from './dto/update-payout-status.dto';
import { CreateCommissionConfigDto } from './dto/create-commission-config.dto';
import {
  SellerBalanceResponseDto,
  PayoutRequestResponseDto,
  PayoutRequestWithBalanceResponseDto,
  PaginatedPayoutResponseDto,
  CommissionConfigResponseDto,
} from './dto/settlement-response.dto';

@Controller('settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  // Balance endpoints
  @Get('seller/:sellerId/balance')
  @ApiTags('balances')
  @ApiOperation({ 
    summary: 'Get seller balance summary', 
    description: 'Get the current balance (available and pending) for a seller. If balance does not exist, it will be created with zero amounts.' 
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID', type: String, example: 'seller-1' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully', type: SellerBalanceResponseDto })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  @ApiBearerAuth('JWT-auth')
  getBalance(@Param('sellerId') sellerId: string) {
    return this.settlementService.getSellerBalance(sellerId);
  }

  // Payout endpoints
  @Get('seller/:sellerId/payouts')
  @ApiTags('payouts')
  @ApiOperation({ 
    summary: 'List seller payout requests', 
    description: 'Get a paginated list of payout requests for a seller with optional status filter. Results are ordered by creation date (newest first).' 
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID', type: String, example: 'seller-1' })
  @ApiQuery({ name: 'status', required: false, enum: ['REQUESTED', 'APPROVED', 'PAID', 'REJECTED'], description: 'Filter by payout status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Payouts retrieved successfully', type: PaginatedPayoutResponseDto })
  @ApiBearerAuth('JWT-auth')
  getPayouts(
    @Param('sellerId') sellerId: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 20;
    return this.settlementService.listPayouts(sellerId, status, p, l);
  }

  @Post('seller/:sellerId/payouts')
  @ApiTags('payouts')
  @ApiOperation({ 
    summary: 'Request payout', 
    description: 'Request a payout from available balance. The requested amount will be moved from available balance to pending balance. A payout request will be created with REQUESTED status.' 
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID', type: String, example: 'seller-1' })
  @ApiResponse({ status: 201, description: 'Payout requested successfully', type: PayoutRequestWithBalanceResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - insufficient available balance' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  requestPayout(@Param('sellerId') sellerId: string, @Body() dto: RequestPayoutDto) {
    return this.settlementService.requestPayout(sellerId, dto.amount, dto.note);
  }

  @Get('payouts/:payoutId')
  @ApiTags('payouts')
  @ApiOperation({ 
    summary: 'Get payout request by ID', 
    description: 'Get detailed information about a specific payout request including status, amount, and timestamps.' 
  })
  @ApiParam({ name: 'payoutId', description: 'Payout request UUID', type: String, example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Payout retrieved successfully', type: PayoutRequestResponseDto })
  @ApiResponse({ status: 404, description: 'Payout request not found' })
  @ApiBearerAuth('JWT-auth')
  getPayout(@Param('payoutId') payoutId: string) {
    return this.settlementService.getPayoutById(payoutId);
  }

  @Patch('payouts/:payoutId/status')
  @ApiTags('payouts')
  @ApiOperation({ 
    summary: 'Update payout status', 
    description: 'Update the status of a payout request (admin only). When status changes to PAID, pending amount is moved to zero. When status changes to REJECTED, amount is returned to available balance.' 
  })
  @ApiParam({ name: 'payoutId', description: 'Payout request UUID', type: String, example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Payout status updated successfully', type: PayoutRequestResponseDto })
  @ApiResponse({ status: 404, description: 'Payout request not found' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid status transition' })
  @ApiBearerAuth('JWT-auth')
  updatePayoutStatus(@Param('payoutId') payoutId: string, @Body() dto: UpdatePayoutStatusDto) {
    return this.settlementService.updatePayoutStatus(payoutId, dto.status, dto.note);
  }

  // Commission config endpoints
  @Post('commission-configs')
  @ApiTags('commission-configs')
  @ApiOperation({ 
    summary: 'Create commission configuration', 
    description: 'Create a new commission configuration for a seller or category. Either sellerId or categoryId must be provided. Commission rate is a decimal (0.15 = 15%).' 
  })
  @ApiResponse({ status: 201, description: 'Commission config created successfully', type: CommissionConfigResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - either sellerId or categoryId must be provided' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  createCommissionConfig(@Body() dto: CreateCommissionConfigDto) {
    return this.settlementService.createCommissionConfig(dto.sellerId, dto.categoryId, dto.commissionRate);
  }

  @Get('commission-configs')
  @ApiTags('commission-configs')
  @ApiOperation({ 
    summary: 'Get commission configurations', 
    description: 'Get commission configurations with optional filters. Can filter by sellerId, categoryId, or both. Returns all matching configurations.' 
  })
  @ApiQuery({ name: 'sellerId', required: false, type: String, description: 'Filter by seller ID' })
  @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'Filter by category ID' })
  @ApiResponse({ status: 200, description: 'Commission configs retrieved successfully', type: [CommissionConfigResponseDto] })
  @ApiBearerAuth('JWT-auth')
  getCommissionConfigs(@Query('sellerId') sellerId?: string, @Query('categoryId') categoryId?: string) {
    return this.settlementService.getCommissionConfigs(sellerId, categoryId);
  }
}
