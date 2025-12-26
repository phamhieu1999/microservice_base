import { Body, Controller, Post } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';

@Controller('vouchers')
export class PromotionController {
  constructor(private readonly service: PromotionService) {}

  @Post('validate')
  validate(@Body() dto: ValidateVoucherDto) {
    return this.service.validate(dto);
  }

  @Post('apply')
  apply(@Body() dto: ApplyVoucherDto) {
    return this.service.apply(dto);
  }
}


