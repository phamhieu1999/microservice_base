import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SellerProxyController } from './seller-proxy.controller';
import { SellerProxyService } from './seller-proxy.service';
import { AuthModule } from '../auth/auth.module';
import { CircuitBreakerModule } from '../../common/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [HttpModule, AuthModule, CircuitBreakerModule],
  controllers: [SellerProxyController],
  providers: [SellerProxyService],
})
export class SellerProxyModule {}


