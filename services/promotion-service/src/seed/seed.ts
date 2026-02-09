import { DataSource } from 'typeorm';
import { Voucher } from '../database/entities/voucher.entity';
import { VoucherUsage } from '../database/entities/voucher-usage.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.PROMO_DB_HOST || 'localhost',
  port: +(process.env.PROMO_DB_PORT || 5432),
  username: process.env.PROMO_DB_USER || 'promo_user',
  password: process.env.PROMO_DB_PASSWORD || 'promo_password',
  database: process.env.PROMO_DB_NAME || 'promo_db',
  entities: [Voucher, VoucherUsage],
  synchronize: false,
});

async function seed() {
  try {
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const voucherRepository = dataSource.getRepository(Voucher);
    const usageRepository = dataSource.getRepository(VoucherUsage);

    // Xóa dữ liệu cũ (optional) - chỉ xóa nếu có dữ liệu
    const existingUsages = await usageRepository.count();
    const existingVouchers = await voucherRepository.count();
    
    if (existingUsages > 0) {
      await usageRepository.clear();
    }
    if (existingVouchers > 0) {
      await voucherRepository.clear();
    }
    
    if (existingUsages > 0 || existingVouchers > 0) {
      console.log('🧹 Cleared existing data');
    }

    // Tạo vouchers mẫu
    const vouchers = [
      {
        code: 'WELCOME10',
        type: 'DISCOUNT' as const,
        scope: 'GLOBAL' as const,
        discountValue: 0.1, // 10%
        maxDiscount: 50000,
        minOrderAmount: 100000,
        usageLimit: 1000,
        perUserLimit: 1,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
      },
      {
        code: 'FREESHIP50K',
        type: 'FREESHIP' as const,
        scope: 'GLOBAL' as const,
        discountValue: 50000,
        maxDiscount: 50000,
        minOrderAmount: 200000,
        usageLimit: 500,
        perUserLimit: 2,
        startAt: new Date(),
        endAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 ngày
      },
      {
        code: 'SHOP20',
        type: 'DISCOUNT' as const,
        scope: 'SHOP' as const,
        shopId: 'shop-001',
        discountValue: 0.2, // 20%
        maxDiscount: 100000,
        minOrderAmount: 50000,
        usageLimit: 100,
        perUserLimit: 3,
        startAt: new Date(),
        endAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 ngày
      },
      {
        code: 'PRODUCT15',
        type: 'DISCOUNT' as const,
        scope: 'PRODUCT' as const,
        productId: 'product-001',
        discountValue: 0.15, // 15%
        maxDiscount: 75000,
        minOrderAmount: 0,
        usageLimit: 200,
        perUserLimit: 5,
        startAt: new Date(),
        endAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 ngày
      },
      {
        code: 'VIP30',
        type: 'DISCOUNT' as const,
        scope: 'GLOBAL' as const,
        discountValue: 0.3, // 30%
        maxDiscount: 200000,
        minOrderAmount: 300000,
        usageLimit: 50,
        perUserLimit: 1,
        startAt: new Date(),
        endAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 ngày
      },
    ];

    const savedVouchers = await voucherRepository.save(vouchers);
    console.log(`✅ Created ${savedVouchers.length} vouchers`);

    // Tạo một số voucher usages mẫu
    if (savedVouchers.length > 0) {
      const usages = [
        {
          voucherId: savedVouchers[0].id,
          userId: 'user-001',
        },
        {
          voucherId: savedVouchers[0].id,
          userId: 'user-002',
        },
        {
          voucherId: savedVouchers[1].id,
          userId: 'user-001',
        },
      ];

      await usageRepository.save(usages);
      console.log(`✅ Created ${usages.length} voucher usages`);
    }

    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seed();

