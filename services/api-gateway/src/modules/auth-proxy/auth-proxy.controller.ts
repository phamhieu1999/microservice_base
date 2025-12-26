import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthProxyService } from './auth-proxy.service';
import { ProxyLoginUseCase } from '../application/auth/use-cases/proxy-login.usecase';
import { ProxyRefreshUseCase } from '../application/auth/use-cases/proxy-refresh.usecase';
import { ProxyLogoutUseCase } from '../application/auth/use-cases/proxy-logout.usecase';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('auth')
export class AuthProxyController {
  constructor(
    private readonly service: AuthProxyService,
    private readonly proxyLogin: ProxyLoginUseCase,
    private readonly proxyRefresh: ProxyRefreshUseCase,
    private readonly proxyLogout: ProxyLogoutUseCase,
  ) {}

  @Post('register')
  @Throttle(5, 60)
  register(@Body() body: any) {
    return this.service.forwardRegister(body);
  }

  @Post('login')
  @Throttle(5, 60)
  login(@Body() body: any) {
    return this.proxyLogin.execute(body);
  }

  @Post('refresh')
  @Throttle(10, 60)
  refresh(@Body() body: any) {
    return this.proxyRefresh.execute(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.proxyLogout.execute(authHeader);
  }
}


