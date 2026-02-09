import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PromotionService } from './promotion.service';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';

@ApiTags('vouchers')
@Controller('vouchers')
export class PromotionController {
  constructor(private readonly service: PromotionService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate voucher code' })
  @ApiResponse({ status: 200, description: 'Voucher validated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid voucher or validation failed' })
  validate(@Body() dto: ValidateVoucherDto) {
    return this.service.validate(dto);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply voucher to order' })
  @ApiResponse({ status: 200, description: 'Voucher applied successfully' })
  @ApiResponse({ status: 400, description: 'Failed to apply voucher' })
  apply(@Body() dto: ApplyVoucherDto) {
    return this.service.apply(dto);
  }
}


