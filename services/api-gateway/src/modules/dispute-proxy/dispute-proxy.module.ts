import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DisputeProxyService } from './dispute-proxy.service';
import { DisputeProxyController } from './dispute-proxy.controller';
import { DisputeAdminController } from './dispute-admin.controller';
import { CircuitBreakerModule } from '../../common/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [HttpModule, CircuitBreakerModule],
  controllers: [DisputeProxyController, DisputeAdminController],
  providers: [DisputeProxyService],
  exports: [DisputeProxyService],
})
export class DisputeProxyModule {}

