import { DataSource } from 'typeorm';
import { SellerBalance } from '../database/entities/seller-balance.entity';
import { CommissionConfig } from '../database/entities/commission-config.entity';
import { PayoutRequest } from '../database/entities/payout-request.entity';

export async function seedDatabase(dataSource: DataSource) {
  const balanceRepo = dataSource.getRepository(SellerBalance);
  const commissionRepo = dataSource.getRepository(CommissionConfig);
  const payoutRepo = dataSource.getRepository(PayoutRequest);

  console.log('🌱 Starting seed data...');

  // Clear existing data
  const existingPayouts = await payoutRepo.find();
  if (existingPayouts.length > 0) {
    await payoutRepo.remove(existingPayouts);
  }
  const existingBalances = await balanceRepo.find();
  if (existingBalances.length > 0) {
    await balanceRepo.remove(existingBalances);
  }
  const existingCommissions = await commissionRepo.find();
  if (existingCommissions.length > 0) {
    await commissionRepo.remove(existingCommissions);
  }

  // Create seller balances
  const balances = [
    balanceRepo.create({
      sellerId: 'seller-1',
      availableAmount: 5000000, // 5,000,000 VND
      pendingAmount: 500000, // 500,000 VND
    }),
    balanceRepo.create({
      sellerId: 'seller-2',
      availableAmount: 10000000, // 10,000,000 VND
      pendingAmount: 0,
    }),
    balanceRepo.create({
      sellerId: 'seller-3',
      availableAmount: 2500000, // 2,500,000 VND
      pendingAmount: 1000000, // 1,000,000 VND
    }),
    balanceRepo.create({
      sellerId: 'seller-4',
      availableAmount: 0,
      pendingAmount: 0,
    }),
  ];

  const savedBalances = await balanceRepo.save(balances);
  console.log(`✅ Created ${savedBalances.length} seller balances`);

  // Create commission configs
  const commissions = [
    commissionRepo.create({
      sellerId: 'seller-1',
      commissionRate: 0.15, // 15%
    }),
    commissionRepo.create({
      sellerId: 'seller-2',
      commissionRate: 0.12, // 12%
    }),
    commissionRepo.create({
      categoryId: 'electronics',
      commissionRate: 0.1, // 10% for electronics category
    }),
    commissionRepo.create({
      categoryId: 'fashion',
      commissionRate: 0.08, // 8% for fashion category
    }),
  ];

  const savedCommissions = await commissionRepo.save(commissions);
  console.log(`✅ Created ${savedCommissions.length} commission configs`);

  // Create payout requests
  const payouts = [
    payoutRepo.create({
      sellerId: 'seller-1',
      amount: 500000,
      status: 'REQUESTED',
      note: 'Monthly payout request',
    }),
    payoutRepo.create({
      sellerId: 'seller-1',
      amount: 1000000,
      status: 'APPROVED',
      note: 'Approved payout',
    }),
    payoutRepo.create({
      sellerId: 'seller-3',
      amount: 1000000,
      status: 'REQUESTED',
      note: 'Pending approval',
    }),
    payoutRepo.create({
      sellerId: 'seller-2',
      amount: 2000000,
      status: 'PAID',
      note: 'Completed payout',
    }),
  ];

  const savedPayouts = await payoutRepo.save(payouts);
  console.log(`✅ Created ${savedPayouts.length} payout requests`);

  console.log('🎉 Seed data completed!');
  return { balances: savedBalances, commissions: savedCommissions, payouts: savedPayouts };
}

