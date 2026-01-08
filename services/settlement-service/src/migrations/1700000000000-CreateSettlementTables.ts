import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSettlementTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create seller_balances table
    await queryRunner.createTable(
      new Table({
        name: 'seller_balances',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'sellerId',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'availableAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'pendingAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
        ],
      }),
      true,
    );

    // Create commission_configs table
    await queryRunner.createTable(
      new Table({
        name: 'commission_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'sellerId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'categoryId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'commissionRate',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0,
          },
        ],
      }),
      true,
    );

    // Create payout_requests table
    await queryRunner.createTable(
      new Table({
        name: 'payout_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'sellerId',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'REQUESTED'",
          },
          {
            name: 'note',
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
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payout_requests', true);
    await queryRunner.dropTable('commission_configs', true);
    await queryRunner.dropTable('seller_balances', true);
  }
}

