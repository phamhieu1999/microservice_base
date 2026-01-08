import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoints as UserPointsOrm } from '../../../database/entities/user-points.entity';
import { PointTransaction as PointTransactionOrm } from '../../../database/entities/point-transaction.entity';
import { Referral as ReferralOrm } from '../../../database/entities/referral.entity';
import { ILoyaltyRepository } from '../../../domain/loyalty/loyalty.repository';
import { UserPoints } from '../../../domain/loyalty/user-points.entity';
import { PointTransaction } from '../../../domain/loyalty/point-transaction.entity';
import { Referral } from '../../../domain/referral/referral.entity';
import {
  ormToDomainUserPoints,
  domainToOrmUserPoints,
  ormToDomainTransaction,
  domainToOrmTransaction,
  ormToDomainReferral,
  domainToOrmReferral,
} from '../../../application/loyalty/mappers/loyalty.mapper';

@Injectable()
export class LoyaltyTypeormRepository implements ILoyaltyRepository {
  constructor(
    @InjectRepository(UserPointsOrm)
    private readonly userPointsRepo: Repository<UserPointsOrm>,
    @InjectRepository(PointTransactionOrm)
    private readonly transactionRepo: Repository<PointTransactionOrm>,
    @InjectRepository(ReferralOrm)
    private readonly referralRepo: Repository<ReferralOrm>,
  ) {}

  async findUserPoints(userId: string): Promise<UserPoints | null> {
    const orm = await this.userPointsRepo.findOne({ where: { userId } });
    return orm ? ormToDomainUserPoints(orm) : null;
  }

  async createUserPoints(userPoints: UserPoints): Promise<UserPoints> {
    const orm = this.userPointsRepo.create(domainToOrmUserPoints(userPoints));
    const saved = await this.userPointsRepo.save(orm);
    return ormToDomainUserPoints(saved);
  }

  async updateUserPoints(userPoints: UserPoints): Promise<UserPoints> {
    await this.userPointsRepo.update(userPoints.userId, domainToOrmUserPoints(userPoints));
    const updated = await this.userPointsRepo.findOne({ where: { userId: userPoints.userId } });
    return ormToDomainUserPoints(updated!);
  }

  async createTransaction(transaction: PointTransaction): Promise<PointTransaction> {
    const orm = this.transactionRepo.create({
      ...domainToOrmTransaction(transaction),
      id: transaction.id,
    });
    const saved = await this.transactionRepo.save(orm);
    return ormToDomainTransaction(saved);
  }

  async findTransactionsByUserId(userId: string, limit = 50, offset = 0): Promise<PointTransaction[]> {
    const orms = await this.transactionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return orms.map(ormToDomainTransaction);
  }

  async findReferralByCode(referralCode: string): Promise<Referral | null> {
    const orm = await this.referralRepo.findOne({ where: { referralCode } });
    return orm ? ormToDomainReferral(orm) : null;
  }

  async findReferralByReferrerId(referrerId: string): Promise<Referral | null> {
    const orm = await this.referralRepo.findOne({ where: { referrerUserId: referrerId } });
    return orm ? ormToDomainReferral(orm) : null;
  }

  async createReferral(referral: Referral): Promise<Referral> {
    const orm = this.referralRepo.create({
      ...domainToOrmReferral(referral),
      id: referral.id,
    });
    const saved = await this.referralRepo.save(orm);
    return ormToDomainReferral(saved);
  }

  async updateReferral(referral: Referral): Promise<Referral> {
    await this.referralRepo.update(referral.id, domainToOrmReferral(referral));
    const updated = await this.referralRepo.findOne({ where: { id: referral.id } });
    return ormToDomainReferral(updated!);
  }
}

