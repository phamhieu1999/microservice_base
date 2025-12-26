import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettlementIndexes1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Indexes for seller_balances table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_seller_balances_seller_id ON seller_balances(seller_id);
    `);

    // Indexes for payout_requests table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payout_requests_seller_id ON payout_requests(seller_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payout_requests_seller_id_status ON payout_requests(seller_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON payout_requests(created_at DESC);
    `);

    // Indexes for commission_configs table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_commission_configs_seller_id ON commission_configs(seller_id) WHERE seller_id IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_commission_configs_category_id ON commission_configs(category_id) WHERE category_id IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_seller_balances_seller_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payout_requests_seller_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payout_requests_seller_id_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payout_requests_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payout_requests_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_commission_configs_seller_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_commission_configs_category_id;`);
  }
}

