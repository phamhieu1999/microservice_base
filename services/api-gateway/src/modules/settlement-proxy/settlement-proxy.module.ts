import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SettlementProxyController } from './settlement-proxy.controller';
import { SettlementProxyService } from './settlement-proxy.service';
import { AuthModule } from '../auth/auth.module';
import { CircuitBreakerModule } from '../../common/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [HttpModule, AuthModule, CircuitBreakerModule],
  controllers: [SettlementProxyController],
  providers: [SettlementProxyService],
})
export class SettlementProxyModule {}

