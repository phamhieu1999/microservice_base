import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoyaltyProxyService } from './loyalty-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyProxyController {
  constructor(private readonly loyaltyService: LoyaltyProxyService) {}

  @Get('points')
  @ApiOperation({ summary: 'Get current loyalty points' })
  getPoints(@Req() req: any) {
    const userId = req.user.userId;
    return this.loyaltyService.getPoints(userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get loyalty point history' })
  getHistory(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const userId = req.user.userId;
    return this.loyaltyService.getHistory(
      userId,
      limit ? parseInt(limit, 10) : undefined,
      skip ? parseInt(skip, 10) : undefined,
    );
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem points or exchange for voucher' })
  redeem(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;
    return this.loyaltyService.redeem(userId, body);
  }
}


