import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthProxyController } from './auth-proxy.controller';
import { AuthProxyService } from './auth-proxy.service';
import { ProxyLoginUseCase } from '../application/auth/use-cases/proxy-login.usecase';
import { ProxyRefreshUseCase } from '../application/auth/use-cases/proxy-refresh.usecase';
import { ProxyLogoutUseCase } from '../application/auth/use-cases/proxy-logout.usecase';

@Module({
  imports: [HttpModule],
  controllers: [AuthProxyController],
  providers: [AuthProxyService, ProxyLoginUseCase, ProxyRefreshUseCase, ProxyLogoutUseCase],
})
export class AuthProxyModule {}


