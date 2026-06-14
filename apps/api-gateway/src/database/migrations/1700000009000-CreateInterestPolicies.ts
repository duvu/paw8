import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInterestPolicies1700000009000 implements MigrationInterface {
  name = 'CreateInterestPolicies1700000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop legacy minimal interest_policies table if it exists (created outside TypeORM migrations)
    await queryRunner.query(`DROP TABLE IF EXISTS interest_policies CASCADE`);

    // 1.1 Create interest_policies table
    await queryRunner.query(`
      CREATE TABLE interest_policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        interest_rate NUMERIC(8,4) NOT NULL,
        interest_type interest_type NOT NULL DEFAULT 'monthly',
        grace_period_days INT NOT NULL DEFAULT 0,
        late_fee_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
        storage_fee_daily NUMERIC(10,2) NOT NULL DEFAULT 0,
        extension_fee_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
        min_loan_amount NUMERIC(18,2),
        max_loan_amount NUMERIC(18,2),
        min_duration_days INT NOT NULL DEFAULT 1,
        max_duration_days INT NOT NULL DEFAULT 365,
        is_default BOOLEAN NOT NULL DEFAULT false,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 1.2 Add policy_id FK to pawn_contracts
    await queryRunner.query(`
      ALTER TABLE pawn_contracts
        ADD COLUMN policy_id UUID REFERENCES interest_policies(id) NULL;
    `);

    // 1.3 Index on interest_policies(tenant_id, is_default, status)
    await queryRunner.query(`
      CREATE INDEX idx_interest_policies_tenant_default_status
        ON interest_policies (tenant_id, is_default, status);
    `);

    // 1.4 Index on pawn_contracts(policy_id)
    await queryRunner.query(`
      CREATE INDEX idx_pawn_contracts_policy_id
        ON pawn_contracts (policy_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pawn_contracts_policy_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interest_policies_tenant_default_status`);
    await queryRunner.query(`ALTER TABLE pawn_contracts DROP COLUMN IF EXISTS policy_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS interest_policies`);
  }
}
