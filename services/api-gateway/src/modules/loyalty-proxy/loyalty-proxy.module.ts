import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LoyaltyProxyService } from './loyalty-proxy.service';
import { LoyaltyProxyController } from './loyalty-proxy.controller';
import { CircuitBreakerModule } from '../../common/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [HttpModule, CircuitBreakerModule],
  controllers: [LoyaltyProxyController],
  providers: [LoyaltyProxyService],
  exports: [LoyaltyProxyService],
})
export class LoyaltyProxyModule {}


