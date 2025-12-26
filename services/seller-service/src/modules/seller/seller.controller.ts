import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { SellerService } from './seller.service';
import { RegisterSellerDto } from './dto/register-seller.dto';

@Controller()
export class SellerController {
  constructor(private readonly service: SellerService) {}

  @Post('sellers/register')
  register(@Req() req: any, @Body() dto: RegisterSellerDto) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.register(userId, dto);
  }

  @Get('sellers/me')
  me(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.getMe(userId);
  }

  @Get('shops/:id')
  getShop(@Param('id') id: string) {
    return this.service.getShop(id);
  }
}


