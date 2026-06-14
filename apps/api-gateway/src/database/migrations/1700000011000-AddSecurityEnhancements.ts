import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSecurityEnhancements1700000011000 implements MigrationInterface {
  name = 'AddSecurityEnhancements1700000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add family_id and replaced_by_hash to refresh_tokens for rotation support
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
        ADD COLUMN IF NOT EXISTS family_id UUID DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS replaced_by_hash VARCHAR(255) DEFAULT NULL
    `);

    // Index for fast family-based revocation
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id
        ON refresh_tokens (family_id)
        WHERE family_id IS NOT NULL
    `);

    // Table to track login attempts for lockout enforcement
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_login_attempts (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email         VARCHAR(255) NOT NULL,
        ip_address    INET,
        tenant_id     UUID REFERENCES tenants(id) ON DELETE SET NULL,
        attempted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        success       BOOLEAN NOT NULL DEFAULT false
      )
    `);

    // Composite index: fast lookup by email + recent time window
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
        ON user_login_attempts (email, attempted_at DESC)
    `);

    // Optional: index by ip for IP-based rate-limit queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
        ON user_login_attempts (ip_address, attempted_at DESC)
        WHERE ip_address IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_login_attempts_ip_time`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_login_attempts_email_time`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_login_attempts`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_family_id`);
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
        DROP COLUMN IF EXISTS replaced_by_hash,
        DROP COLUMN IF EXISTS family_id
    `);
  }
}
