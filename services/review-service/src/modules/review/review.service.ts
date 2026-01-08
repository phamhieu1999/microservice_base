import { Injectable, ConflictException } from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly repo: ReviewRepository) {}

  async create(userId: string, dto: CreateReviewDto) {
    // Check if user already reviewed this product
    const existingReview = await this.repo.checkUserReviewForProduct(userId, dto.productId);
    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }
    return this.repo.create(userId, dto);
  }

  async findById(id: string) {
    return this.repo.findById(id);
  }

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    return this.repo.update(id, userId, dto);
  }

  async delete(id: string, userId: string) {
    return this.repo.delete(id, userId);
  }

  async listByProduct(productId: string, query?: QueryReviewsDto) {
    const [reviews, total] = await Promise.all([
      this.repo.findByProduct(productId, query),
      this.repo.countByProduct(productId, query?.rating),
    ]);

    return {
      data: reviews,
      pagination: {
        page: query?.page || 1,
        limit: query?.limit || 10,
        total,
        totalPages: Math.ceil(total / (query?.limit || 10)),
      },
    };
  }

  async listByUser(userId: string, query?: QueryReviewsDto) {
    const [reviews, total] = await Promise.all([
      this.repo.findByUser(userId, query),
      this.repo.countByUser(userId, query?.rating),
    ]);

    return {
      data: reviews,
      pagination: {
        page: query?.page || 1,
        limit: query?.limit || 10,
        total,
        totalPages: Math.ceil(total / (query?.limit || 10)),
      },
    };
  }

  async findAll(query?: QueryReviewsDto) {
    const [reviews, total] = await Promise.all([
      this.repo.findAll(query),
      this.repo.countAll(query?.rating),
    ]);

    return {
      data: reviews,
      pagination: {
        page: query?.page || 1,
        limit: query?.limit || 10,
        total,
        totalPages: Math.ceil(total / (query?.limit || 10)),
      },
    };
  }

  async getStatsByProduct(productId: string) {
    return this.repo.getStatsByProduct(productId);
  }
}


