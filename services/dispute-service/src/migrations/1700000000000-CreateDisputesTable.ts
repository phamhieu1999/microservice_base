import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

export class CreateDisputesTable1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'disputes',
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
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'sellerId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'OPEN'",
            isNullable: false,
          },
          {
            name: 'reasonCode',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'attachments',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'resolution',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'escalatedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'resolvedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'updatedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'idx_disputes_order_id',
        columnNames: ['orderId'],
      }),
    );

    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'idx_disputes_user_id',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'idx_disputes_seller_id',
        columnNames: ['sellerId'],
      }),
    );

    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'idx_disputes_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'idx_disputes_user_id_status',
        columnNames: ['userId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'idx_disputes_seller_id_status',
        columnNames: ['sellerId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'idx_disputes_created_at',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('disputes');
  }
}

