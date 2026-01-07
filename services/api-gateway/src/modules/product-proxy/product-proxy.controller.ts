import { Controller, Get, Param, Patch, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ProductProxyService } from './product-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('products')
@Controller('products')
export class ProductProxyController {
  constructor(private readonly service: ProductProxyService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo sản phẩm mới (Admin/Seller)' })
  @ApiBody({ description: 'Thông tin sản phẩm, sẽ được gắn sellerId theo user' })
  create(@Body() body: any, @Req() req: any) {
    const user = req.user;
    // tạm thời map sellerId = userId để hỗ trợ multi-seller cơ bản
    body.sellerId = user.userId;
    return this.service.forwardCreate(body);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách sản phẩm, có thể filter theo q' })
  @ApiQuery({ name: 'q', required: false, description: 'Từ khoá tìm kiếm' })
  findAll(@Query('q') q?: string) {
    return this.service.forwardFindAll(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm' })
  @ApiParam({ name: 'id', description: 'ID sản phẩm' })
  findOne(@Param('id') id: string) {
    return this.service.forwardFindOne(id);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Lấy thông tin nhiều sản phẩm theo danh sách ID' })
  @ApiBody({
    description: 'Danh sách ID sản phẩm cần lấy',
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['ids'],
    },
  })
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật sản phẩm' })
  @ApiParam({ name: 'id', description: 'ID sản phẩm' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.forwardUpdate(id, body);
  }
}


