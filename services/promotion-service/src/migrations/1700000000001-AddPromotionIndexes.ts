import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromotionIndexes1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Indexes for vouchers table (bổ sung thêm indexes cho performance)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(type);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vouchers_scope ON vouchers(scope);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vouchers_shop_id ON vouchers("shopId") WHERE "shopId" IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vouchers_product_id ON vouchers("productId") WHERE "productId" IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vouchers_start_end ON vouchers("startAt", "endAt");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vouchers_created_at ON vouchers("createdAt");
    `);

    // Indexes for voucher_usages table (bổ sung thêm indexes)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_voucher_usages_voucher_user ON voucher_usages("voucherId", "userId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_voucher_usages_used_at ON voucher_usages("usedAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vouchers_type;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vouchers_scope;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vouchers_shop_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vouchers_product_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vouchers_start_end;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vouchers_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_voucher_usages_voucher_user;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_voucher_usages_used_at;`);
  }
}

