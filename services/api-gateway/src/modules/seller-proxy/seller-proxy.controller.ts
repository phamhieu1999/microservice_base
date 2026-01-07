import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SellerProxyService } from './seller-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('sellers')
@Controller()
export class SellerProxyController {
  constructor(private readonly service: SellerProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('sellers/register')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng ký trở thành seller' })
  @ApiBody({ description: 'Thông tin seller (shop name, địa chỉ, ...)' })
  register(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.register(authHeader, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sellers/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin seller tương ứng với user hiện tại' })
  me(@Req() req: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.me(authHeader);
  }

  @Get('shops/:id')
  @ApiOperation({ summary: 'Lấy thông tin shop theo ID' })
  @ApiParam({ name: 'id', description: 'ID shop/seller' })
  getShop(@Param('id') id: string) {
    return this.service.getShop(id);
  }
}


