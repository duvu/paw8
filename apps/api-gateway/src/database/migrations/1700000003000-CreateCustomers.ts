import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomers1700000003000 implements MigrationInterface {
  name = 'CreateCustomers1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE customer_status AS ENUM ('active', 'blacklisted');

      CREATE TABLE customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        identity_number VARCHAR(50),
        date_of_birth DATE,
        permanent_address TEXT,
        current_address TEXT,
        occupation VARCHAR(100),
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(20),
        status customer_status NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(tenant_id, identity_number),
        UNIQUE(tenant_id, phone)
      );

      CREATE TABLE customer_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL, -- id_front, id_back, portrait
        file_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_customers_tenant_phone ON customers(tenant_id, phone);
      CREATE INDEX idx_customers_tenant_identity ON customers(tenant_id, identity_number);
      CREATE INDEX idx_customers_tenant_status ON customers(tenant_id, status);
      CREATE INDEX idx_customer_docs_customer ON customer_documents(customer_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS customer_documents;
      DROP TABLE IF EXISTS customers;
      DROP TYPE IF EXISTS customer_status;
    `);
  }
}
