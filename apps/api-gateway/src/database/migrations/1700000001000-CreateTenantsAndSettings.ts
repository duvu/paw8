import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantsAndSettings1700000001000 implements MigrationInterface {
  name = 'CreateTenantsAndSettings1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE tenant_status AS ENUM ('active', 'locked', 'trial', 'expired');
      CREATE TYPE tenant_plan AS ENUM ('trial', 'basic', 'pro', 'enterprise');

      CREATE TABLE tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        status tenant_status NOT NULL DEFAULT 'trial',
        plan tenant_plan NOT NULL DEFAULT 'trial',
        max_stores INT NOT NULL DEFAULT 1,
        max_users INT NOT NULL DEFAULT 5,
        trial_end_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE tenant_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        key VARCHAR(100) NOT NULL,
        value TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(tenant_id, key)
      );

      CREATE INDEX idx_tenant_settings_tenant ON tenant_settings(tenant_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS tenant_settings;
      DROP TABLE IF EXISTS tenants;
      DROP TYPE IF EXISTS tenant_plan;
      DROP TYPE IF EXISTS tenant_status;
    `);
  }
}
