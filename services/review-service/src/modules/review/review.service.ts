import { Injectable } from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly repo: ReviewRepository) {}

  create(userId: string, dto: CreateReviewDto) {
    return this.repo.create(userId, dto);
  }

  listByProduct(productId: string) {
    return this.repo.findByProduct(productId);
  }
}


