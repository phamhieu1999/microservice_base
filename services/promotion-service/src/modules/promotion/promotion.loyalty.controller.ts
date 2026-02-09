import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PromotionService } from './promotion.service';
import { LoyaltyExchangeDto } from './dto/loyalty-exchange.dto';

@ApiTags('loyalty')
@Controller('loyalty-vouchers')
export class PromotionLoyaltyController {
  constructor(private readonly service: PromotionService) {}

  @Post('exchange')
  @ApiOperation({ summary: 'Exchange loyalty points for voucher' })
  @ApiResponse({ status: 200, description: 'Voucher created successfully' })
  @ApiResponse({ status: 400, description: 'Not enough points to exchange' })
  async exchange(@Body() dto: LoyaltyExchangeDto) {
    return this.service.createLoyaltyVoucher(dto.userId, dto.points);
  }
}
