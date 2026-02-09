import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderIndexes1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Indexes for orders table
    await queryRunner.query(`
      -- Entity dùng camelCase userId, createdAt, orderGroupId
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders("userId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders("createdAt" DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_order_group_id ON orders("orderGroupId") WHERE "orderGroupId" IS NOT NULL;
    `);

    // Indexes for order_items table
    await queryRunner.query(`
      -- order_items không có các cột snake_case, chỉ có quan hệ và productId/sellerId
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items("productId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items("sellerId") WHERE "sellerId" IS NOT NULL;
    `);

    // Indexes for order_history table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history("orderId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_order_history_status ON order_history(status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_order_history_created_at ON order_history("createdAt" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_order_group_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_product_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_seller_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_history_order_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_history_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_history_created_at;`);
  }
}

