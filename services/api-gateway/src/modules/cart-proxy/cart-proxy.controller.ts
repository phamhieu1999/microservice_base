import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CartProxyService } from './cart-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cart')
export class CartProxyController {
  constructor(private readonly service: CartProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getCart(@Req() req: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.getCart(authHeader);
  }

  @UseGuards(JwtAuthGuard)
  @Post('items')
  upsertItem(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.upsertItem(authHeader, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:productId')
  removeItem(@Req() req: any, @Param('productId') productId: string) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.removeItem(authHeader, productId);
  }
}


