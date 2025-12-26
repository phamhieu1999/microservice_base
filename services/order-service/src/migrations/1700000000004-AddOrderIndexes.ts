import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderIndexes1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Indexes for orders table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_order_group_id ON orders(order_group_id) WHERE order_group_id IS NOT NULL;
    `);

    // Indexes for order_items table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items(seller_id) WHERE seller_id IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
    `);

    // Indexes for order_history table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_order_history_status ON order_history(status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_order_history_created_at ON order_history(created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_order_group_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_order_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_seller_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_product_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_history_order_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_history_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_history_created_at;`);
  }
}

