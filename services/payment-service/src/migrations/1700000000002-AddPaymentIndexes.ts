import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentIndexes1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Indexes for payments table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_idempotency_key ON payments(idempotency_key) WHERE idempotency_key IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_order_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_idempotency_key;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_created_at;`);
  }
}

