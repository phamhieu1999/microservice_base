import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';

@Injectable()
export class ReviewRepository {
  constructor(
    @InjectModel(Review.name)
    private readonly model: Model<Review>,
  ) {}

  create(userId: string, dto: CreateReviewDto) {
    return this.model.create({ userId, ...dto });
  }

  async findById(id: string) {
    const review = await this.model.findById(id).exec();
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.model.findOneAndUpdate(
      { _id: id, userId },
      { $set: dto },
      { new: true, runValidators: true },
    ).exec();
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found or you don't have permission to update it`);
    }
    return review;
  }

  async delete(id: string, userId: string) {
    const review = await this.model.findOneAndDelete({ _id: id, userId }).exec();
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found or you don't have permission to delete it`);
    }
    return review;
  }

  findByProduct(productId: string, query?: QueryReviewsDto) {
    const filter: any = { productId };
    if (query?.rating) {
      filter.rating = query.rating;
    }

    const sort: any = {};
    sort[query?.sortBy || 'createdAt'] = query?.sortOrder === 'asc' ? 1 : -1;

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    return this.model
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countByProduct(productId: string, rating?: number) {
    const filter: any = { productId };
    if (rating) {
      filter.rating = rating;
    }
    return this.model.countDocuments(filter).exec();
  }

  findByUser(userId: string, query?: QueryReviewsDto) {
    const sort: any = {};
    sort[query?.sortBy || 'createdAt'] = query?.sortOrder === 'asc' ? 1 : -1;

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { userId };
    if (query?.rating) {
      filter.rating = query.rating;
    }

    return this.model
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countByUser(userId: string, rating?: number) {
    const filter: any = { userId };
    if (rating) {
      filter.rating = rating;
    }
    return this.model.countDocuments(filter).exec();
  }

  findAll(query?: QueryReviewsDto) {
    const sort: any = {};
    sort[query?.sortBy || 'createdAt'] = query?.sortOrder === 'asc' ? 1 : -1;

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query?.rating) {
      filter.rating = query.rating;
    }

    return this.model
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countAll(rating?: number) {
    const filter: any = {};
    if (rating) {
      filter.rating = rating;
    }
    return this.model.countDocuments(filter).exec();
  }

  async getStatsByProduct(productId: string) {
    const reviews = await this.model.find({ productId }).exec();
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        productId,
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const sumRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = sumRating / totalReviews;

    const ratingDistribution = {
      1: reviews.filter((r) => r.rating === 1).length,
      2: reviews.filter((r) => r.rating === 2).length,
      3: reviews.filter((r) => r.rating === 3).length,
      4: reviews.filter((r) => r.rating === 4).length,
      5: reviews.filter((r) => r.rating === 5).length,
    };

    return {
      productId,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    };
  }

  async checkUserReviewForProduct(userId: string, productId: string) {
    return this.model.findOne({ userId, productId }).exec();
  }
}


