import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromotionIndexes1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Indexes for vouchers table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vouchers_scope ON vouchers(scope);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vouchers_shop_id ON vouchers(shop_id) WHERE shop_id IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vouchers_product_id ON vouchers(product_id) WHERE product_id IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vouchers_valid_from_valid_to ON vouchers(valid_from, valid_to);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
    `);

    // Indexes for voucher_usages table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_voucher_usages_voucher_id ON voucher_usages(voucher_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_voucher_usages_user_id ON voucher_usages(user_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_voucher_usages_order_id ON voucher_usages(order_id) WHERE order_id IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vouchers_code;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vouchers_scope;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vouchers_shop_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vouchers_product_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vouchers_valid_from_valid_to;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vouchers_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_voucher_usages_voucher_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_voucher_usages_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_voucher_usages_order_id;`);
  }
}

