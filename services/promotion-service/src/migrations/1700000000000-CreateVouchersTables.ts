import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateVouchersTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tạo extension uuid-ossp nếu chưa có
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Tạo bảng vouchers
    await queryRunner.createTable(
      new Table({
        name: 'vouchers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            default: "'DISCOUNT'",
          },
          {
            name: 'scope',
            type: 'varchar',
            length: '50',
            default: "'GLOBAL'",
          },
          {
            name: 'shopId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'productId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'discountValue',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'maxDiscount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'minOrderAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'usageLimit',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'perUserLimit',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'startAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'endAt',
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

    // Tạo bảng voucher_usages
    await queryRunner.createTable(
      new Table({
        name: 'voucher_usages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'voucherId',
            type: 'uuid',
          },
          {
            name: 'userId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'usedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Tạo foreign key cho voucher_usages
    await queryRunner.createForeignKey(
      'voucher_usages',
      new TableForeignKey({
        columnNames: ['voucherId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'vouchers',
        onDelete: 'CASCADE',
        name: 'FK_voucher_usages_voucher_id',
      }),
    );

    // Tạo indexes cơ bản
    await queryRunner.createIndex(
      'vouchers',
      new TableIndex({
        name: 'IDX_VOUCHERS_CODE',
        columnNames: ['code'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'voucher_usages',
      new TableIndex({
        name: 'IDX_VOUCHER_USAGES_VOUCHER_ID',
        columnNames: ['voucherId'],
      }),
    );

    await queryRunner.createIndex(
      'voucher_usages',
      new TableIndex({
        name: 'IDX_VOUCHER_USAGES_USER_ID',
        columnNames: ['userId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('voucher_usages', 'FK_voucher_usages_voucher_id');
    await queryRunner.dropIndex('voucher_usages', 'IDX_VOUCHER_USAGES_USER_ID');
    await queryRunner.dropIndex('voucher_usages', 'IDX_VOUCHER_USAGES_VOUCHER_ID');
    await queryRunner.dropIndex('vouchers', 'IDX_VOUCHERS_CODE');
    await queryRunner.dropTable('voucher_usages');
    await queryRunner.dropTable('vouchers');
  }
}

