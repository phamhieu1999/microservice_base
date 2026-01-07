import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrderProxyService } from './order-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderProxyController {
  constructor(private readonly service: OrderProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('USER', 'ADMIN')
  @Throttle({ default: { limit: 10, ttl: 60 } }) // 10 requests per minute
  @Post()
  @ApiOperation({ summary: 'Tạo đơn hàng mới' })
  @ApiBody({ description: 'Payload tạo đơn hàng, được forward sang Order Service' })
  create(@Body() body: any, @Req() req: any) {
    const user = req.user;
    return this.service.forwardCreate(user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('USER', 'ADMIN')
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng theo ID' })
  @ApiParam({ name: 'id', description: 'ID đơn hàng' })
  get(@Param('id') id: string) {
    return this.service.forwardGet(id);
  }
}


