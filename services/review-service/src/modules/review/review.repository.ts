import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewRepository {
  constructor(
    @InjectModel(Review.name)
    private readonly model: Model<Review>,
  ) {}

  create(userId: string, dto: CreateReviewDto) {
    return this.model.create({ userId, ...dto });
  }

  findByProduct(productId: string) {
    return this.model.find({ productId }).sort({ createdAt: -1 }).exec();
  }
}


