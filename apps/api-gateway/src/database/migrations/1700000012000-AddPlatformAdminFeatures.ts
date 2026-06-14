import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlatformAdminFeatures1700000012000 implements MigrationInterface {
  name = 'AddPlatformAdminFeatures1700000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add grace_period_days to tenants for trial expiry scheduler
    await queryRunner.query(`
      ALTER TABLE tenants
        ADD COLUMN IF NOT EXISTS grace_period_days INTEGER NOT NULL DEFAULT 3
    `);

    // tenant_plans: optional per-tenant plan config overrides
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant_plans (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        plan_code        VARCHAR(50) NOT NULL,
        max_stores       INTEGER NOT NULL DEFAULT 1,
        max_users        INTEGER NOT NULL DEFAULT 5,
        features         JSONB NOT NULL DEFAULT '{}',
        effective_from   DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_plans_tenant_id
        ON tenant_plans (tenant_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS tenant_plans`);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS grace_period_days`);
  }
}
