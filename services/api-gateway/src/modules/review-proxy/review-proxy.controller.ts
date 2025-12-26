import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ReviewProxyService } from './review-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class ReviewProxyController {
  constructor(private readonly service: ReviewProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('reviews')
  create(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.createReview(authHeader, body);
  }

  @Get('products/:productId/reviews')
  list(@Param('productId') productId: string) {
    return this.service.listByProduct(productId);
  }
}


