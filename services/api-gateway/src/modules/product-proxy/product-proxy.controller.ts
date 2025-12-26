import { Controller, Get, Param, Patch, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ProductProxyService } from './product-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('products')
export class ProductProxyController {
  constructor(private readonly service: ProductProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() body: any, @Req() req: any) {
    const user = req.user;
    // tạm thời map sellerId = userId để hỗ trợ multi-seller cơ bản
    body.sellerId = user.userId;
    return this.service.forwardCreate(body);
  }

  @Get()
  findAll(@Query('q') q?: string) {
    return this.service.forwardFindAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.forwardFindOne(id);
  }

  @Post('batch')
  async getProductsBatch(@Body() body: { ids: string[] }) {
    // Fetch multiple products in parallel
    // This reduces the number of HTTP requests when frontend needs multiple products
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      throw new Error('ids array is required');
    }
    if (body.ids.length > 50) {
      throw new Error('Maximum 50 products per batch request');
    }
    return this.service.forwardBatch(body.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.forwardUpdate(id, body);
  }
}


