import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartItemDto } from './dto/cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get()
  getCart(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.getCart(userId);
  }

  @Post('items')
  upsertItem(@Req() req: any, @Body() dto: CartItemDto) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.upsertItem(userId, dto);
  }

  @Delete('items/:productId')
  removeItem(@Req() req: any, @Param('productId') productId: string) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.removeItem(userId, productId);
  }
}


