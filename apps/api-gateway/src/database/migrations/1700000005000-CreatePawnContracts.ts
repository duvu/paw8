import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePawnContracts1700000005000 implements MigrationInterface {
  name = 'CreatePawnContracts1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE contract_status AS ENUM (
        'draft', 'active', 'near_due', 'overdue', 'extended',
        'settled', 'cancelled', 'liquidation_pending', 'liquidated'
      );
      CREATE TYPE interest_type AS ENUM ('daily', 'monthly', 'per_period');

      CREATE TABLE contract_sequences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        store_id UUID NOT NULL REFERENCES stores(id),
        year_month CHAR(6) NOT NULL,
        last_seq INT NOT NULL DEFAULT 0,
        UNIQUE(tenant_id, store_id, year_month)
      );

      CREATE TABLE pawn_contracts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        store_id UUID NOT NULL REFERENCES stores(id),
        customer_id UUID NOT NULL REFERENCES customers(id),
        contract_code VARCHAR(100) NOT NULL,
        principal_amount NUMERIC(18,2) NOT NULL,
        interest_rate NUMERIC(8,4) NOT NULL,
        interest_type interest_type NOT NULL DEFAULT 'monthly',
        start_date DATE NOT NULL,
        due_date DATE NOT NULL,
        status contract_status NOT NULL DEFAULT 'draft',
        notes TEXT,
        created_by UUID NOT NULL REFERENCES users(id),
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(tenant_id, contract_code)
      );

      CREATE TABLE contract_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        contract_id UUID NOT NULL REFERENCES pawn_contracts(id) ON DELETE CASCADE,
        asset_id UUID NOT NULL REFERENCES assets(id),
        UNIQUE(contract_id, asset_id)
      );

      CREATE TABLE contract_status_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        contract_id UUID NOT NULL REFERENCES pawn_contracts(id) ON DELETE CASCADE,
        from_status contract_status,
        to_status contract_status NOT NULL,
        note TEXT,
        changed_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_contracts_tenant_store_status ON pawn_contracts(tenant_id, store_id, status);
      CREATE INDEX idx_contracts_tenant_due_date ON pawn_contracts(tenant_id, due_date);
      CREATE INDEX idx_contracts_tenant_customer ON pawn_contracts(tenant_id, customer_id);
      CREATE INDEX idx_contracts_tenant_code ON pawn_contracts(tenant_id, contract_code);
      CREATE INDEX idx_contract_status_history_contract ON contract_status_history(contract_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS contract_status_history;
      DROP TABLE IF EXISTS contract_assets;
      DROP TABLE IF EXISTS pawn_contracts;
      DROP TABLE IF EXISTS contract_sequences;
      DROP TYPE IF EXISTS interest_type;
      DROP TYPE IF EXISTS contract_status;
    `);
  }
}
