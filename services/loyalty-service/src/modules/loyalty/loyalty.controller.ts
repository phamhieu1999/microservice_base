import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { CreateReferralDto } from './dto/create-referral.dto';

@ApiTags('loyalty')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('points')
  @ApiOperation({ summary: 'Get user loyalty points' })
  @ApiResponse({ status: 200 })
  async getPoints(@Req() req: any) {
    const userId = req.user?.userId || req.headers['x-user-id'] || 'mock-user';
    return this.loyaltyService.getUserPoints(userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get loyalty points history' })
  @ApiResponse({ status: 200 })
  async getHistory(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const userId = req.user?.userId || req.headers['x-user-id'] || 'mock-user';
    return this.loyaltyService.getPointHistory(
      userId,
      limit ? parseInt(limit, 10) : 50,
      skip ? parseInt(skip, 10) : 0,
    );
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem loyalty points' })
  @ApiResponse({ status: 200 })
  async redeem(@Req() req: any, @Body() dto: RedeemPointsDto) {
    const userId = req.user?.userId || req.headers['x-user-id'] || 'mock-user';
    // Nếu có voucherId thì chỉ trừ điểm; nếu không, cho phép đổi điểm lấy voucher mới
    if (dto.voucherId) {
      return this.loyaltyService.redeemPoints(userId, dto.points, dto.voucherId);
    }
    return this.loyaltyService.exchangePointsForVoucher(userId, dto.points);
  }

  @Post('referral')
  @ApiOperation({ summary: 'Create referral code' })
  @ApiResponse({ status: 201 })
  async createReferral(@Req() req: any, @Body() _dto: CreateReferralDto) {
    const userId = req.user?.userId || req.headers['x-user-id'] || 'mock-user';
    return this.loyaltyService.createReferral(userId);
  }
}
