import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateShippingTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create shipping_methods table
    await queryRunner.createTable(
      new Table({
        name: 'shipping_methods',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'baseFee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'perItemFee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'perKgFee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'estimatedDays',
            type: 'int',
            default: 1,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'ACTIVE'",
          },
          {
            name: 'description',
            type: 'varchar',
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

    // Create shipping_quotes table
    await queryRunner.createTable(
      new Table({
        name: 'shipping_quotes',
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
            isNullable: true,
          },
          {
            name: 'shippingMethodId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'PENDING'",
          },
          {
            name: 'totalFee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'estimatedDays',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'originAddress',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'destinationAddress',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'breakdown',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
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

    // Create shipping_orders table
    await queryRunner.createTable(
      new Table({
        name: 'shipping_orders',
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
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'quoteId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'PENDING'",
          },
          {
            name: 'shippingFee',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'trackingNumber',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'carrier',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'originAddress',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'destinationAddress',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'recipientName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'recipientPhone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'shippedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deliveredAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'trackingHistory',
            type: 'jsonb',
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

    // Add foreign keys
    await queryRunner.createForeignKey(
      'shipping_quotes',
      new TableForeignKey({
        columnNames: ['shippingMethodId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_methods',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_orders',
      new TableForeignKey({
        columnNames: ['quoteId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_quotes',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('shipping_orders', true);
    await queryRunner.dropTable('shipping_quotes', true);
    await queryRunner.dropTable('shipping_methods', true);
  }
}

