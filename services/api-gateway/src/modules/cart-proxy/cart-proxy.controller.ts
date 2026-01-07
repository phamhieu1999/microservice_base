import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CartProxyService } from './cart-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
export class CartProxyController {
  constructor(private readonly service: CartProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Lấy giỏ hàng hiện tại của user' })
  getCart(@Req() req: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.getCart(authHeader);
  }

  @UseGuards(JwtAuthGuard)
  @Post('items')
  @ApiOperation({ summary: 'Thêm/cập nhật item trong giỏ hàng' })
  @ApiBody({ description: 'Thông tin sản phẩm và số lượng trong giỏ' })
  upsertItem(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.upsertItem(authHeader, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:productId')
  @ApiOperation({ summary: 'Xoá sản phẩm khỏi giỏ hàng' })
  @ApiParam({ name: 'productId', description: 'ID sản phẩm trong giỏ' })
  removeItem(@Req() req: any, @Param('productId') productId: string) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.removeItem(authHeader, productId);
  }
}


