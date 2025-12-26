import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewService } from './review.service';

// Ở đây chưa dùng JwtGuard, vì service này nằm sau Gateway; Gateway sẽ bảo vệ.
@Controller()
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  @Post('reviews')
  create(@Req() req: any, @Body() dto: CreateReviewDto) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.create(userId, dto);
  }

  @Get('products/:productId/reviews')
  list(@Param('productId') productId: string) {
    return this.service.listByProduct(productId);
  }
}


