import { Inject, Injectable, Optional } from '@nestjs/common';
import { ILoyaltyRepository } from '../../../domain/loyalty/loyalty.repository';
import { UserPoints } from '../../../domain/loyalty/user-points.entity';
import { PointTransaction, TransactionType, TransactionSource } from '../../../domain/loyalty/point-transaction.entity';
import { KafkaService } from '../../../kafka/kafka.service';
import { TracingService } from '../../../common/tracing.service';
import { v4 as uuidv4 } from 'uuid';

export interface EarnPointsInput {
  userId: string;
  amount: number; // Số tiền (VND) để tính điểm
  orderId?: string;
  paymentId?: string;
  referralId?: string;
  source?: TransactionSource;
  description?: string;
}

@Injectable()
export class EarnPointsUseCase {
  constructor(
    @Inject('ILoyaltyRepository') private readonly repo: ILoyaltyRepository,
    private readonly kafka: KafkaService,
    @Optional() private readonly tracing?: TracingService,
  ) {}

  async execute(input: EarnPointsInput): Promise<{ points: number; totalPoints: number; tier: string }> {
    // Tính điểm dựa trên tier của user
    let userPoints = await this.repo.findUserPoints(input.userId);
    
    if (!userPoints) {
      // Tạo user points mới nếu chưa có
      userPoints = new UserPoints(input.userId, 0, 0, 'BRONZE', 0);
      await this.repo.createUserPoints(userPoints);
    }

    // Tính điểm dựa trên tier (1 point per 1000 VND cho BRONZE, tăng dần theo tier)
    const earnRate = this.getEarnRate(userPoints.tier);
    const points = Math.floor((input.amount / 1000) * earnRate);

    if (points <= 0) {
      return { points: 0, totalPoints: userPoints.totalPoints, tier: userPoints.tier };
    }

    // Thêm điểm
    userPoints.addPoints(points);
    
    // Kiểm tra và cập nhật tier
    const newTier = this.calculateTier(userPoints.lifetimePoints);
    if (newTier !== userPoints.tier) {
      userPoints.updateTier(newTier);
    }

    await this.repo.updateUserPoints(userPoints);

    // Tạo transaction
    const transaction = new PointTransaction(
      uuidv4(),
      input.userId,
      points,
      'EARNED' as TransactionType,
      input.source || 'PURCHASE' as TransactionSource,
      input.description || `Earned ${points} points`,
      input.orderId,
      input.paymentId,
      input.referralId,
      undefined,
      undefined,
      new Date(),
    );
    await this.repo.createTransaction(transaction);

    // Emit event
    await this.kafka.emit('points.earned', {
      userId: input.userId,
      points,
      totalPoints: userPoints.totalPoints,
      tier: userPoints.tier,
      orderId: input.orderId,
      paymentId: input.paymentId,
    });

    // Emit tier upgrade event nếu có
    if (newTier !== userPoints.tier) {
      await this.kafka.emit('tier.upgraded', {
        userId: input.userId,
        oldTier: userPoints.tier,
        newTier,
        totalPoints: userPoints.lifetimePoints,
      });
    }

    return { points, totalPoints: userPoints.totalPoints, tier: userPoints.tier };
  }

  private getEarnRate(tier: string): number {
    const rates: Record<string, number> = {
      BRONZE: 1.0,
      SILVER: 1.2,
      GOLD: 1.5,
      PLATINUM: 2.0,
    };
    return rates[tier] || 1.0;
  }

  private calculateTier(lifetimePoints: number): string {
    if (lifetimePoints >= 100000) return 'PLATINUM';
    if (lifetimePoints >= 50000) return 'GOLD';
    if (lifetimePoints >= 10000) return 'SILVER';
    return 'BRONZE';
  }
}

