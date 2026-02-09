import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePaymentsTable1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'orderId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'PENDING'",
          },
          {
            name: 'method',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'providerTxnId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'idempotencyKey',
            type: 'varchar',
            length: '255',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'refundedAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'providerResponse',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Đảm bảo idempotent: dùng CREATE INDEX IF NOT EXISTS
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PAYMENTS_ORDER_ID" ON "payments" ("orderId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PAYMENTS_STATUS" ON "payments" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PAYMENTS_IDEMPOTENCY_KEY" ON "payments" ("idempotencyKey");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_PAYMENTS_ORDER_ID";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_PAYMENTS_STATUS";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_PAYMENTS_IDEMPOTENCY_KEY";`);
    await queryRunner.dropTable('payments');
  }
}

