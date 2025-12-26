import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SellerProxyService } from './seller-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class SellerProxyController {
  constructor(private readonly service: SellerProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('sellers/register')
  register(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.register(authHeader, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sellers/me')
  me(@Req() req: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.me(authHeader);
  }

  @Get('shops/:id')
  getShop(@Param('id') id: string) {
    return this.service.getShop(id);
  }
}


