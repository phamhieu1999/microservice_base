import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoyaltyIndexes1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Indexes for user_points table (userId already has unique index from entity)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_points_tier ON user_points(tier);
    `);

    // Indexes for point_transactions table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions("userId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(type);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id_type ON point_transactions("userId", type);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions("createdAt" DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_point_transactions_reference_id ON point_transactions("referenceId") WHERE "referenceId" IS NOT NULL;
    `);

    // Indexes for referrals table
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals("referralCode");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON referrals("referrerUserId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals("referredUserId") WHERE "referredUserId" IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_points_tier;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_point_transactions_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_point_transactions_type;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_point_transactions_user_id_type;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_point_transactions_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_point_transactions_reference_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_referrals_referral_code;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_referrals_referrer_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_referrals_referred_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_referrals_status;`);
  }
}

