import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PromotionProxyService } from './promotion-proxy.service';
import { PromotionProxyController } from './promotion-proxy.controller';
import { LoyaltyVoucherProxyController } from './loyalty-voucher-proxy.controller';
import { AuthModule } from '../auth/auth.module';
import { CircuitBreakerModule } from '../../common/circuit-breaker/circuit-breaker.module';
import { LoyaltyProxyModule } from '../loyalty-proxy/loyalty-proxy.module';

@Module({
  imports: [HttpModule, AuthModule, CircuitBreakerModule, LoyaltyProxyModule],
  controllers: [PromotionProxyController, LoyaltyVoucherProxyController],
  providers: [PromotionProxyService],
  exports: [PromotionProxyService],
})
export class PromotionProxyModule {}


