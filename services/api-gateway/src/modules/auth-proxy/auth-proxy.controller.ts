import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthProxyService } from './auth-proxy.service';
import { ProxyLoginUseCase } from '../../application/auth/use-cases/proxy-login.usecase';
import { ProxyRefreshUseCase } from '../../application/auth/use-cases/proxy-refresh.usecase';
import { ProxyLogoutUseCase } from '../../application/auth/use-cases/proxy-logout.usecase';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthProxyController {
  constructor(
    private readonly service: AuthProxyService,
    private readonly proxyLogin: ProxyLoginUseCase,
    private readonly proxyRefresh: ProxyRefreshUseCase,
    private readonly proxyLogout: ProxyLogoutUseCase,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiBody({ description: 'Thông tin đăng ký user, forward sang Auth Service' })
  register(@Body() body: any) {
    return this.service.forwardRegister(body);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @ApiOperation({ summary: 'Đăng nhập, nhận access token/refresh token' })
  @ApiBody({ description: 'Thông tin đăng nhập (email/username, mật khẩu)' })
  login(@Body() body: any) {
    return this.proxyLogin.execute(body);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @ApiOperation({ summary: 'Làm mới access token bằng refresh token' })
  @ApiBody({ description: 'Payload chứa refresh token' })
  refresh(@Body() body: any) {
    return this.proxyRefresh.execute(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Đăng xuất, revoke token hiện tại' })
  logout(@Req() req: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.proxyLogout.execute(authHeader);
  }
}


