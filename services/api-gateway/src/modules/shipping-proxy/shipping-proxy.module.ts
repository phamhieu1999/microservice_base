import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ShippingProxyController } from './shipping-proxy.controller';
import { ShippingProxyService } from './shipping-proxy.service';
import { AuthModule } from '../auth/auth.module';
import { CircuitBreakerModule } from '../../common/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [HttpModule, AuthModule, CircuitBreakerModule],
  controllers: [ShippingProxyController],
  providers: [ShippingProxyService],
  exports: [ShippingProxyService],
})
export class ShippingProxyModule {}


