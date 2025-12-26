import { Inject, Injectable } from '@nestjs/common';
import { ILoyaltyRepository } from '../../../domain/loyalty/loyalty.repository';
import { PointTransaction } from '../../../domain/loyalty/point-transaction.entity';

export interface GetPointsHistoryInput {
  userId: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class GetPointsHistoryUseCase {
  constructor(@Inject('ILoyaltyRepository') private readonly repo: ILoyaltyRepository) {}

  async execute(input: GetPointsHistoryInput): Promise<PointTransaction[]> {
    return this.repo.findTransactionsByUserId(input.userId, input.limit || 50, input.offset || 0);
  }
}

