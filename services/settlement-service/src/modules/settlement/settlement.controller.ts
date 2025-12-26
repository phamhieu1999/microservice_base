import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SettlementService } from './settlement.service';

@ApiTags('settlements')
@Controller('settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get('seller/:sellerId/summary')
  @ApiOperation({ summary: 'Get seller balance summary' })
  getSummary(@Param('sellerId') sellerId: string) {
    return this.settlementService.getSellerBalance(sellerId);
  }

  @Get('seller/:sellerId/payouts')
  @ApiOperation({ summary: 'List seller payout requests' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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
  @ApiOperation({ summary: 'Request payout' })
  requestPayout(@Param('sellerId') sellerId: string, @Body() body: { amount: number }) {
    return this.settlementService.requestPayout(sellerId, body.amount);
  }
}
