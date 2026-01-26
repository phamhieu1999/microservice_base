import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('auth')
export class OAuthController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport sẽ redirect đến Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: any, @Res() res: Response) {
    // User đã được authenticate bởi Passport, nhận tokens từ OAuthService
    const { accessToken, refreshToken, user } = req.user ?? {};

    const frontendBase =
      process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = new URL('/oauth/callback', frontendBase);

    if (accessToken && refreshToken) {
      redirectUrl.searchParams.set('accessToken', accessToken);
      redirectUrl.searchParams.set('refreshToken', refreshToken);
      if (user) {
        redirectUrl.searchParams.set(
          'user',
          encodeURIComponent(JSON.stringify(user)),
        );
      }
    } else {
      // Nếu vì lý do nào đó không có token, redirect về trang login với lỗi
      redirectUrl.searchParams.set('error', 'oauth_failed');
    }

    return res.redirect(redirectUrl.toString());
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookAuth() {
    // Passport sẽ redirect đến Facebook
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  facebookCallback(@Req() req: any) {
    // User đã được authenticate, trả về tokens
    return req.user;
  }
}

