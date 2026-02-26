import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOutboxEventsTable1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.createTable(
      new Table({
        name: 'outbox_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'aggregateType',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'aggregateId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'topic',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'payload',
            type: 'jsonb',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: `'PENDING'`,
          },
          {
            name: 'publishedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'retryCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'lastError',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Partial index for efficient polling: only indexes PENDING rows
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_outbox_pending"
      ON "outbox_events" ("status", "createdAt")
      WHERE "status" = 'PENDING';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_outbox_pending"`);
    await queryRunner.dropTable('outbox_events', true);
  }
}
