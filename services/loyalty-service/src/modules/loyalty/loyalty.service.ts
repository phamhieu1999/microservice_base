import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoints, LoyaltyTier } from '../../database/entities/user-points.entity';
import { PointTransaction, PointTransactionType } from '../../database/entities/point-transaction.entity';
import { PointTier } from '../../database/entities/point-tier.entity';
import { Referral } from '../../database/entities/referral.entity';
import { PromotionClient } from '../../promotion/promotion.client';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(UserPoints) private readonly userPointsRepo: Repository<UserPoints>,
    @InjectRepository(PointTransaction) private readonly txRepo: Repository<PointTransaction>,
    @InjectRepository(PointTier) private readonly tierRepo: Repository<PointTier>,
    @InjectRepository(Referral) private readonly referralRepo: Repository<Referral>,
    private readonly promotionClient: PromotionClient,
  ) {}

  private calculatePointsFromAmount(amount: number): number {
    // Ví dụ: 1 point cho mỗi 10.000 VNĐ
    return Math.floor(amount / 10000);
  }

  private async recalculateTier(userId: string, balance: number): Promise<LoyaltyTier> {
    const tiers = await this.tierRepo.find({ order: { minPoints: 'ASC' } });
    let tier: LoyaltyTier = 'BRONZE';

    for (const t of tiers) {
      if (balance >= t.minPoints && balance <= t.maxPoints) {
        tier = t.name as LoyaltyTier;
        break;
      }
    }

    await this.userPointsRepo.update({ userId }, { tier });
    return tier;
  }

  async getUserPoints(userId: string) {
    let userPoints = await this.userPointsRepo.findOne({ where: { userId } });
    if (!userPoints) {
      userPoints = this.userPointsRepo.create({ userId, balance: 0, tier: 'BRONZE' });
      await this.userPointsRepo.save(userPoints);
    }
    return userPoints;
  }

  async getPointHistory(userId: string, limit = 50, skip = 0) {
    return this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });
  }

  async earnPointsForPayment(userId: string, orderId: string, amount: number) {
    const points = this.calculatePointsFromAmount(amount);
    if (points <= 0) return null;

    const userPoints = await this.getUserPoints(userId);
    const newBalance = userPoints.balance + points;

    const tx = this.txRepo.create({
      userId,
      points,
      type: 'EARN',
      source: 'ORDER',
      referenceId: orderId,
      balanceAfter: newBalance,
    });
    await this.txRepo.save(tx);

    userPoints.balance = newBalance;
    userPoints.updatedAt = new Date();
    await this.userPointsRepo.save(userPoints);

    const tier = await this.recalculateTier(userId, newBalance);

    return { balance: newBalance, tier, pointsEarned: points };
  }

  async redeemPoints(userId: string, points: number, referenceId?: string) {
    if (points <= 0) {
      throw new BadRequestException('Points must be positive');
    }

    const userPoints = await this.getUserPoints(userId);
    if (userPoints.balance < points) {
      throw new BadRequestException('Insufficient points');
    }

    const newBalance = userPoints.balance - points;

    const tx = this.txRepo.create({
      userId,
      points: -points,
      type: 'REDEEM',
      source: 'REDEEM',
      referenceId,
      balanceAfter: newBalance,
    });
    await this.txRepo.save(tx);

    userPoints.balance = newBalance;
    userPoints.updatedAt = new Date();
    await this.userPointsRepo.save(userPoints);

    const tier = await this.recalculateTier(userId, newBalance);

    return { balance: newBalance, tier, pointsRedeemed: points };
  }

  // Đổi điểm lấy voucher: gọi PromotionService để tạo voucher loyalty
  async exchangePointsForVoucher(userId: string, points: number) {
    const result = await this.redeemPoints(userId, points, 'LOYALTY_VOUCHER');
    const voucher = await this.promotionClient.exchangePointsForVoucher(userId, points);
    return { ...result, voucher };
  }

  async createReferral(userId: string) {
    const code = `REF-${userId}-${Date.now()}`;
    const referral = this.referralRepo.create({
      referrerUserId: userId,
      referralCode: code,
      status: 'PENDING',
    });
    await this.referralRepo.save(referral);
    return referral;
  }

  async completeReferral(referralCode: string, referredUserId: string) {
    const referral = await this.referralRepo.findOne({ where: { referralCode } });
    if (!referral) throw new NotFoundException('Referral not found');

    if (referral.status !== 'PENDING') {
      throw new BadRequestException('Referral already completed or cancelled');
    }

    referral.referredUserId = referredUserId;
    referral.status = 'COMPLETED';
    referral.completedAt = new Date();
    referral.pointsAwarded = 100; // fixed bonus
    await this.referralRepo.save(referral);

    // Award points to referrer
    await this.earnPointsManual(referral.referrerUserId, referral.pointsAwarded, 'REFERRAL', referral.id);

    return referral;
  }

  async earnPointsManual(userId: string, points: number, source: string, referenceId?: string) {
    if (points <= 0) throw new BadRequestException('Points must be positive');

    const userPoints = await this.getUserPoints(userId);
    const newBalance = userPoints.balance + points;

    const tx = this.txRepo.create({
      userId,
      points,
      type: 'ADJUST',
      source,
      referenceId,
      balanceAfter: newBalance,
    });
    await this.txRepo.save(tx);

    userPoints.balance = newBalance;
    userPoints.updatedAt = new Date();
    await this.userPointsRepo.save(userPoints);

    const tier = await this.recalculateTier(userId, newBalance);

    return { balance: newBalance, tier, pointsEarned: points };
  }
}
