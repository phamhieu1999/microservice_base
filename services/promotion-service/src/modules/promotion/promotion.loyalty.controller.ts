import { Body, Controller, Post } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { LoyaltyExchangeDto } from './dto/loyalty-exchange.dto';

@Controller('loyalty-vouchers')
export class PromotionLoyaltyController {
  constructor(private readonly service: PromotionService) {}

  @Post('exchange')
  async exchange(@Body() dto: LoyaltyExchangeDto) {
    return this.service.createLoyaltyVoucher(dto.userId, dto.points);
  }
}
