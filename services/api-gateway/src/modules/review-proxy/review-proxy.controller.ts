import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewProxyService } from './review-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('reviews')
@Controller()
export class ReviewProxyController {
  constructor(private readonly service: ReviewProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('reviews')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo review cho sản phẩm' })
  @ApiBody({ description: 'Nội dung review, rating, productId, ...' })
  create(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.createReview(authHeader, body);
  }

  @Get('products/:productId/reviews')
  @ApiOperation({ summary: 'Danh sách review của một sản phẩm' })
  @ApiParam({ name: 'productId', description: 'ID sản phẩm' })
  list(@Param('productId') productId: string) {
    return this.service.listByProduct(productId);
  }
}


