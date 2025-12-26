import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OrderProxyController } from './order-proxy.controller';
import { OrderProxyService } from './order-proxy.service';
import { AuthModule } from '../auth/auth.module';
import { PromotionProxyModule } from '../promotion-proxy/promotion-proxy.module';
import { ShippingProxyModule } from '../shipping-proxy/shipping-proxy.module';

@Module({
  imports: [HttpModule, AuthModule, PromotionProxyModule, ShippingProxyModule],
  controllers: [OrderProxyController],
  providers: [OrderProxyService],
})
export class OrderProxyModule {}


