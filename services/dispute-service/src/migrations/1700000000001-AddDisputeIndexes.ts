import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDisputeIndexes1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Indexes for disputes table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_user_id ON disputes(user_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_seller_id ON disputes(seller_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_user_id_status ON disputes(user_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_seller_id_status ON disputes(seller_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_disputes_order_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_disputes_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_disputes_seller_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_disputes_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_disputes_user_id_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_disputes_seller_id_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_disputes_created_at;`);
  }
}

