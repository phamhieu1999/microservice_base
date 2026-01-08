import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentProxyController } from './payment-proxy.controller';
import { PaymentProxyService } from './payment-proxy.service';
import { AuthModule } from '../auth/auth.module';
import { CircuitBreakerModule } from '../../common/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [HttpModule, AuthModule, CircuitBreakerModule],
  controllers: [PaymentProxyController],
  providers: [PaymentProxyService],
  exports: [PaymentProxyService],
})
export class PaymentProxyModule {}

