import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactions1700000006000 implements MigrationInterface {
  name = 'CreateTransactions1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE transaction_type AS ENUM (
        'disbursement', 'interest_collection', 'fee_collection',
        'principal_partial', 'settlement', 'adjustment', 'void', 'reversal'
      );
      CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'other');

      CREATE TABLE contract_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        store_id UUID NOT NULL REFERENCES stores(id),
        contract_id UUID NOT NULL REFERENCES pawn_contracts(id),
        transaction_type transaction_type NOT NULL,
        amount NUMERIC(18,2) NOT NULL,
        payment_method payment_method NOT NULL DEFAULT 'cash',
        transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
        note TEXT,
        void_of_id UUID REFERENCES contract_transactions(id),
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        -- No UPDATE or DELETE — append-only table
      );

      CREATE TABLE contract_extensions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        contract_id UUID NOT NULL REFERENCES pawn_contracts(id),
        old_due_date DATE NOT NULL,
        new_due_date DATE NOT NULL,
        interest_paid_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
        fee_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE payment_receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        store_id UUID NOT NULL REFERENCES stores(id),
        contract_id UUID NOT NULL REFERENCES pawn_contracts(id),
        transaction_id UUID REFERENCES contract_transactions(id),
        receipt_number VARCHAR(100) NOT NULL,
        amount NUMERIC(18,2) NOT NULL,
        issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        issued_by UUID NOT NULL REFERENCES users(id),
        UNIQUE(tenant_id, receipt_number)
      );

      CREATE INDEX idx_transactions_tenant_store_date
        ON contract_transactions(tenant_id, store_id, transaction_date);
      CREATE INDEX idx_transactions_contract
        ON contract_transactions(contract_id);
      CREATE INDEX idx_extensions_contract ON contract_extensions(contract_id);
      CREATE INDEX idx_receipts_contract ON payment_receipts(contract_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS payment_receipts;
      DROP TABLE IF EXISTS contract_extensions;
      DROP TABLE IF EXISTS contract_transactions;
      DROP TYPE IF EXISTS payment_method;
      DROP TYPE IF EXISTS transaction_type;
    `);
  }
}
