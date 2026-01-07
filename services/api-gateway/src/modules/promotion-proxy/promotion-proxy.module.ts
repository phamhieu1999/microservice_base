import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PromotionProxyService } from './promotion-proxy.service';
import { PromotionProxyController } from './promotion-proxy.controller';
import { LoyaltyVoucherProxyController } from './loyalty-voucher-proxy.controller';
import { AuthModule } from '../auth/auth.module';
import { CircuitBreakerModule } from '../../common/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [HttpModule, AuthModule, CircuitBreakerModule],
  controllers: [PromotionProxyController, LoyaltyVoucherProxyController],
  providers: [PromotionProxyService],
  exports: [PromotionProxyService],
})
export class PromotionProxyModule {}


