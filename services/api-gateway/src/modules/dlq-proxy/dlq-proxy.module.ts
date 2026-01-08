import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DLQProxyService } from './dlq-proxy.service';
import { DLQProxyController } from './dlq-proxy.controller';
import { CircuitBreakerModule } from '../../common/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [HttpModule, CircuitBreakerModule],
  controllers: [DLQProxyController],
  providers: [DLQProxyService],
  exports: [DLQProxyService],
})
export class DLQProxyModule {}

