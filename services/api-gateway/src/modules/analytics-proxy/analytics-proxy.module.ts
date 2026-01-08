import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalyticsProxyService } from './analytics-proxy.service';
import { AnalyticsProxyController } from './analytics-proxy.controller';
import { CircuitBreakerModule } from '../../common/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [HttpModule, CircuitBreakerModule],
  controllers: [AnalyticsProxyController],
  providers: [AnalyticsProxyService],
  exports: [AnalyticsProxyService],
})
export class AnalyticsProxyModule {}

