import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ShippingProxyService } from './shipping-proxy.service';

@Module({
  imports: [HttpModule],
  providers: [ShippingProxyService],
  exports: [ShippingProxyService],
})
export class ShippingProxyModule {}


