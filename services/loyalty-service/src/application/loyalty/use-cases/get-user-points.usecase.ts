import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ILoyaltyRepository } from '../../../domain/loyalty/loyalty.repository';
import { UserPoints } from '../../../domain/loyalty/user-points.entity';

@Injectable()
export class GetUserPointsUseCase {
  constructor(@Inject('ILoyaltyRepository') private readonly repo: ILoyaltyRepository) {}

  async execute(userId: string): Promise<UserPoints> {
    let userPoints = await this.repo.findUserPoints(userId);
    
    if (!userPoints) {
      // Tạo user points mới nếu chưa có
      userPoints = new UserPoints(userId, 0, 0, 'BRONZE', 0);
      await this.repo.createUserPoints(userPoints);
    }

    return userPoints;
  }
}

