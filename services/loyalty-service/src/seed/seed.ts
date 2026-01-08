import { DataSource } from 'typeorm';
import { UserPoints, LoyaltyTier } from '../database/entities/user-points.entity';
import { PointTransaction, PointTransactionType } from '../database/entities/point-transaction.entity';
import { PointTier } from '../database/entities/point-tier.entity';
import { Referral, ReferralStatus } from '../database/entities/referral.entity';

export async function seedDatabase(dataSource: DataSource) {
  const userPointsRepo = dataSource.getRepository(UserPoints);
  const txRepo = dataSource.getRepository(PointTransaction);
  const tierRepo = dataSource.getRepository(PointTier);
  const referralRepo = dataSource.getRepository(Referral);

  console.log('🌱 Starting loyalty seed data...');

  // Clear existing seed data
  const existingUsers = await userPointsRepo.find({
    where: [
      { userId: 'seed-user-1' },
      { userId: 'seed-user-2' },
      { userId: 'seed-user-3' },
    ],
  });
  if (existingUsers.length > 0) {
    await userPointsRepo.remove(existingUsers);
    console.log(`🗑️  Removed ${existingUsers.length} existing seed users`);
  }

  // Create point tiers
  const tiers = [
    tierRepo.create({
      name: 'BRONZE',
      minPoints: 0,
      maxPoints: 999,
      benefits: 'Basic benefits, 1% cashback',
    }),
    tierRepo.create({
      name: 'SILVER',
      minPoints: 1000,
      maxPoints: 4999,
      benefits: 'Silver benefits, 2% cashback, free shipping',
    }),
    tierRepo.create({
      name: 'GOLD',
      minPoints: 5000,
      maxPoints: 19999,
      benefits: 'Gold benefits, 3% cashback, priority support',
    }),
    tierRepo.create({
      name: 'PLATINUM',
      minPoints: 20000,
      maxPoints: 999999,
      benefits: 'Platinum benefits, 5% cashback, exclusive offers',
    }),
  ];

  // Clear existing tiers and create new ones
  await tierRepo.clear();
  const savedTiers = await tierRepo.save(tiers);
  console.log(`✅ Created ${savedTiers.length} point tiers`);

  // Create sample user points
  const sampleUsers = [
    userPointsRepo.create({
      userId: 'seed-user-1',
      balance: 5000,
      tier: 'GOLD' as LoyaltyTier,
    }),
    userPointsRepo.create({
      userId: 'seed-user-2',
      balance: 1500,
      tier: 'SILVER' as LoyaltyTier,
    }),
    userPointsRepo.create({
      userId: 'seed-user-3',
      balance: 500,
      tier: 'BRONZE' as LoyaltyTier,
    }),
  ];

  const savedUsers = await userPointsRepo.save(sampleUsers);
  console.log(`✅ Created ${savedUsers.length} sample user points`);

  // Create sample transactions
  const sampleTransactions = [
    txRepo.create({
      userId: 'seed-user-1',
      points: 1000,
      type: 'EARN' as PointTransactionType,
      source: 'ORDER',
      referenceId: 'seed-order-1',
      balanceAfter: 5000,
    }),
    txRepo.create({
      userId: 'seed-user-1',
      points: -500,
      type: 'REDEEM' as PointTransactionType,
      source: 'REDEEM',
      referenceId: 'seed-voucher-1',
      balanceAfter: 4500,
    }),
    txRepo.create({
      userId: 'seed-user-2',
      points: 500,
      type: 'EARN' as PointTransactionType,
      source: 'ORDER',
      referenceId: 'seed-order-2',
      balanceAfter: 1500,
    }),
    txRepo.create({
      userId: 'seed-user-3',
      points: 200,
      type: 'EARN' as PointTransactionType,
      source: 'REFERRAL',
      referenceId: 'seed-referral-1',
      balanceAfter: 500,
    }),
  ];

  const savedTransactions = await txRepo.save(sampleTransactions);
  console.log(`✅ Created ${savedTransactions.length} sample transactions`);

  // Create sample referrals
  const sampleReferrals = [
    referralRepo.create({
      referrerUserId: 'seed-user-1',
      referralCode: 'REF-SEED-USER-1-001',
      status: 'COMPLETED' as ReferralStatus,
      referredUserId: 'seed-user-3',
      pointsAwarded: 200,
      completedAt: new Date(),
    }),
    referralRepo.create({
      referrerUserId: 'seed-user-2',
      referralCode: 'REF-SEED-USER-2-001',
      status: 'PENDING' as ReferralStatus,
    }),
  ];

  const savedReferrals = await referralRepo.save(sampleReferrals);
  console.log(`✅ Created ${savedReferrals.length} sample referrals`);

  console.log('🎉 Loyalty seed data completed!');
  return {
    tiers: savedTiers,
    users: savedUsers,
    transactions: savedTransactions,
    referrals: savedReferrals,
  };
}

