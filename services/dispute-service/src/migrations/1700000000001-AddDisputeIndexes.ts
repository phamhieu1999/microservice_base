// This migration is now included in CreateDisputesTable migration
// Keeping this file for backward compatibility but it's no longer needed
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDisputeIndexes1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Indexes are already created in CreateDisputesTable migration
    // This migration is kept for backward compatibility
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}

