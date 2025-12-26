import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthIndexes1700000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Indexes for users table
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
    `);

    // Indexes for refresh_tokens table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(jti);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
    `);

    // Indexes for login_attempts table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at DESC);
    `);

    // Indexes for user_devices table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON user_devices(device_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_jti;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_expires_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_login_attempts_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_login_attempts_ip_address;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_login_attempts_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_devices_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_devices_device_id;`);
  }
}

