import { Body, Controller, Post } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ShippingQuoteDto } from './dto/shipping-quote.dto';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  @Post('quote')
  quote(@Body() dto: ShippingQuoteDto) {
    return this.service.quote(dto);
  }
}


