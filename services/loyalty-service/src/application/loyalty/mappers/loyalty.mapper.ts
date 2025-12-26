import { UserPoints as UserPointsDomain } from '../../../domain/loyalty/user-points.entity';
import { UserPoints as UserPointsOrm } from '../../../database/entities/user-points.entity';
import { PointTransaction as PointTransactionDomain } from '../../../domain/loyalty/point-transaction.entity';
import { PointTransaction as PointTransactionOrm } from '../../../database/entities/point-transaction.entity';
import { Referral as ReferralDomain } from '../../../domain/referral/referral.entity';
import { Referral as ReferralOrm } from '../../../database/entities/referral.entity';

export function ormToDomainUserPoints(orm: UserPointsOrm): UserPointsDomain {
  return new UserPointsDomain(
    orm.userId,
    orm.totalPoints,
    orm.availablePoints,
    orm.tier,
    orm.lifetimePoints,
  );
}

export function domainToOrmUserPoints(domain: UserPointsDomain): Partial<UserPointsOrm> {
  return {
    userId: domain.userId,
    totalPoints: domain.totalPoints,
    availablePoints: domain.availablePoints,
    tier: domain.tier,
    lifetimePoints: domain.lifetimePoints,
  };
}

export function ormToDomainTransaction(orm: PointTransactionOrm): PointTransactionDomain {
  return new PointTransactionDomain(
    orm.id,
    orm.userId,
    orm.points,
    orm.type,
    orm.source,
    orm.description,
    orm.orderId,
    orm.paymentId,
    orm.referralId,
    orm.voucherId,
    orm.expiresAt,
    orm.createdAt,
  );
}

export function domainToOrmTransaction(domain: PointTransactionDomain): Partial<PointTransactionOrm> {
  return {
    userId: domain.userId,
    points: domain.points,
    type: domain.type,
    source: domain.source,
    description: domain.description,
    orderId: domain.orderId,
    paymentId: domain.paymentId,
    referralId: domain.referralId,
    voucherId: domain.voucherId,
    expiresAt: domain.expiresAt,
  };
}

export function ormToDomainReferral(orm: ReferralOrm): ReferralDomain {
  return new ReferralDomain(
    orm.id,
    orm.referrerId,
    orm.referredId,
    orm.referralCode,
    orm.pointsEarned,
    orm.totalReferrals,
    orm.isActive,
    orm.createdAt,
    orm.updatedAt,
  );
}

export function domainToOrmReferral(domain: ReferralDomain): Partial<ReferralOrm> {
  return {
    referrerId: domain.referrerId,
    referredId: domain.referredId,
    referralCode: domain.referralCode,
    pointsEarned: domain.pointsEarned,
    totalReferrals: domain.totalReferrals,
    isActive: domain.isActive,
  };
}

