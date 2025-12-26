import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrderProxyService } from './order-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('orders')
export class OrderProxyController {
  constructor(private readonly service: OrderProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('USER', 'ADMIN')
  @Throttle(10, 60) // 10 requests per minute
  @Post()
  create(@Body() body: any, @Req() req: any) {
    const user = req.user;
    return this.service.forwardCreate(user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('USER', 'ADMIN')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.forwardGet(id);
  }
}


