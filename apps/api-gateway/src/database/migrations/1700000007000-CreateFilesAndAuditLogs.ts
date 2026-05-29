import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFilesAndAuditLogs1700000007000 implements MigrationInterface {
  name = 'CreateFilesAndAuditLogs1700000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        store_id UUID REFERENCES stores(id),
        entity_type VARCHAR(50) NOT NULL, -- customer, asset, contract, receipt
        entity_id UUID NOT NULL,
        bucket VARCHAR(100) NOT NULL,
        object_key TEXT NOT NULL UNIQUE,
        original_filename VARCHAR(255),
        mime_type VARCHAR(100),
        file_size BIGINT,
        uploaded_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id),
        store_id UUID REFERENCES stores(id),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id UUID,
        old_value JSONB,
        new_value JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE interest_policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        asset_type VARCHAR(50),
        interest_rate NUMERIC(8,4) NOT NULL,
        interest_type VARCHAR(20) NOT NULL DEFAULT 'monthly',
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_files_tenant_entity ON files(tenant_id, entity_type, entity_id);
      CREATE INDEX idx_audit_tenant_created_at ON audit_logs(tenant_id, created_at);
      CREATE INDEX idx_audit_user ON audit_logs(user_id);
      CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
      CREATE INDEX idx_interest_policies_tenant ON interest_policies(tenant_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS interest_policies;
      DROP TABLE IF EXISTS refresh_tokens;
      DROP TABLE IF EXISTS audit_logs;
      DROP TABLE IF EXISTS files;
    `);
  }
}
