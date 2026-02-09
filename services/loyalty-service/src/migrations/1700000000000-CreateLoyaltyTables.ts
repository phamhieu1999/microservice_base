import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateLoyaltyTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create point_tiers table
    await queryRunner.createTable(
      new Table({
        name: 'point_tiers',
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
            length: '50',
            isUnique: true,
          },
          {
            name: 'minPoints',
            type: 'int',
          },
          {
            name: 'maxPoints',
            type: 'int',
          },
          {
            name: 'benefits',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create user_points table
    await queryRunner.createTable(
      new Table({
        name: 'user_points',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'balance',
            type: 'int',
            default: 0,
          },
          {
            name: 'tier',
            type: 'varchar',
            length: '20',
            default: "'BRONZE'",
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

    await queryRunner.createIndex(
      'user_points',
      new TableIndex({
        name: 'IDX_USER_POINTS_USER_ID',
        columnNames: ['userId'],
        isUnique: true,
      }),
    );

    // Create point_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'point_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'points',
            type: 'int',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'source',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'referenceId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'balanceAfter',
            type: 'int',
            default: 0,
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

    await queryRunner.createIndex(
      'point_transactions',
      new TableIndex({
        name: 'IDX_POINT_TRANSACTIONS_USER_ID',
        columnNames: ['userId'],
      }),
    );

    // Create referrals table
    await queryRunner.createTable(
      new Table({
        name: 'referrals',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'referrerUserId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'referralCode',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'referredUserId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'pointsAwarded',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'referrals',
      new TableIndex({
        name: 'IDX_REFERRALS_REFERRAL_CODE',
        columnNames: ['referralCode'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'referrals',
      new TableIndex({
        name: 'IDX_REFERRALS_REFERRER_USER_ID',
        columnNames: ['referrerUserId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('referrals');
    await queryRunner.dropTable('point_transactions');
    await queryRunner.dropTable('user_points');
    await queryRunner.dropTable('point_tiers');
  }
}

