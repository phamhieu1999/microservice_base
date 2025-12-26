import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSellerIndexes1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Indexes for sellers table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON sellers(user_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sellers_status ON sellers(status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sellers_created_at ON sellers(created_at DESC);
    `);

    // Indexes for shops table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_shops_seller_id ON shops(seller_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_shops_name ON shops(name);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sellers_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sellers_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sellers_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_shops_seller_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_shops_name;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_shops_status;`);
  }
}

