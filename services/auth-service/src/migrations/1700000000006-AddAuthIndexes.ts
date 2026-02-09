import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthIndexes1700000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Indexes for users table
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    await queryRunner.query(`
      -- Entity dùng camelCase "createdAt"
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users("createdAt" DESC);
    `);

    // Indexes for refresh_tokens table
    await queryRunner.query(`
      -- Entity dùng "userId"
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens("userId");
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(jti);
    `);
    await queryRunner.query(`
      -- Không có cột expires_at, chỉ có createdAt
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_created_at ON refresh_tokens("createdAt" DESC);
    `);

    // Indexes for login_attempts table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts("ipAddress");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts("createdAt" DESC);
    `);

    // Indexes for user_devices table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices("userId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON user_devices("deviceId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_jti;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_login_attempts_ip_address;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_login_attempts_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_devices_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_devices_device_id;`);
  }
}

