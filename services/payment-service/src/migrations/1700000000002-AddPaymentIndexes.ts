import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentIndexes1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Additional indexes for payments table
    // Note: IDX_PAYMENTS_ORDER_ID, IDX_PAYMENTS_STATUS, IDX_PAYMENTS_IDEMPOTENCY_KEY 
    // are already created in the first migration, so we only add new ones here
    
    // Index for createdAt to improve query performance on date-based queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments("createdAt" DESC);
    `);
    
    // Index for providerTxnId to improve lookup performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_provider_txn_id ON payments("providerTxnId") WHERE "providerTxnId" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_provider_txn_id;`);
  }
}

