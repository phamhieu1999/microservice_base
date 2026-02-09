import { UserPoints as UserPointsDomain } from '../../../domain/loyalty/user-points.entity';
import { UserPoints as UserPointsOrm, LoyaltyTier } from '../../../database/entities/user-points.entity';
import { PointTransaction as PointTransactionDomain } from '../../../domain/loyalty/point-transaction.entity';
import { PointTransaction as PointTransactionOrm, PointTransactionType } from '../../../database/entities/point-transaction.entity';
import { Referral as ReferralDomain } from '../../../domain/referral/referral.entity';
import { Referral as ReferralOrm } from '../../../database/entities/referral.entity';

// Map ORM UserPoints to Domain UserPoints
export function ormToDomainUserPoints(orm: UserPointsOrm): UserPointsDomain {
  return new UserPointsDomain(
    orm.userId,
    orm.balance, // totalPoints = balance
    orm.balance, // availablePoints = balance
    orm.tier,
    orm.balance, // lifetimePoints = balance (simplified)
  );
}

// Map Domain UserPoints to ORM UserPoints
export function domainToOrmUserPoints(domain: UserPointsDomain): Partial<UserPointsOrm> {
  return {
    userId: domain.userId,
    balance: domain.availablePoints,
    tier: domain.tier as LoyaltyTier,
  };
}

// Map ORM PointTransaction to Domain PointTransaction
export function ormToDomainTransaction(orm: PointTransactionOrm): PointTransactionDomain {
  // Map PointTransactionType to TransactionType
  const typeMap: Record<PointTransactionType, 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'REFUNDED'> = {
    EARN: 'EARNED',
    REDEEM: 'REDEEMED',
    ADJUST: 'EARNED',
    REFERRAL: 'EARNED',
  };

  const sourceMap: Record<string, 'PURCHASE' | 'REFERRAL' | 'BONUS' | 'REDEMPTION' | 'REFUND'> = {
    ORDER: 'PURCHASE',
    REFERRAL: 'REFERRAL',
    PROMO: 'BONUS',
    REDEEM: 'REDEMPTION',
    ADMIN: 'BONUS',
  };

  return new PointTransactionDomain(
    orm.id,
    orm.userId,
    orm.points,
    typeMap[orm.type] || 'EARNED',
    sourceMap[orm.source || ''] || 'BONUS',
    undefined, // description
    orm.referenceId, // orderId
    undefined, // paymentId
    orm.referenceId, // referralId (if source is REFERRAL)
    undefined, // voucherId
    undefined, // expiresAt
    orm.createdAt,
  );
}

// Map Domain PointTransaction to ORM PointTransaction
export function domainToOrmTransaction(domain: PointTransactionDomain): Partial<PointTransactionOrm> {
  const typeMap: Record<'EARNED' | 'REDEEMED' | 'EXPIRED' | 'REFUNDED', PointTransactionType> = {
    EARNED: 'EARN',
    REDEEMED: 'REDEEM',
    EXPIRED: 'ADJUST',
    REFUNDED: 'ADJUST',
  };

  return {
    userId: domain.userId,
    points: domain.points,
    type: typeMap[domain.type] || 'EARN',
    source: domain.source,
    referenceId: domain.orderId || domain.referralId || domain.voucherId,
  };
}

// Map ORM Referral to Domain Referral
export function ormToDomainReferral(orm: ReferralOrm): ReferralDomain {
  return new ReferralDomain(
    orm.id,
    orm.referrerUserId,
    orm.referralCode,
    orm.pointsAwarded,
    0, // totalReferrals (not in ORM)
    orm.status === 'COMPLETED', // isActive
    orm.referredUserId,
    orm.createdAt,
    orm.completedAt,
  );
}

// Map Domain Referral to ORM Referral
export function domainToOrmReferral(domain: ReferralDomain): Partial<ReferralOrm> {
  return {
    referrerUserId: domain.referrerId,
    referredUserId: domain.referredId,
    referralCode: domain.referralCode,
    pointsAwarded: domain.pointsEarned,
    status: domain.isActive ? 'COMPLETED' : 'PENDING',
  };
}

