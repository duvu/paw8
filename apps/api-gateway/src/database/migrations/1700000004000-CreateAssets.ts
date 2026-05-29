import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssets1700000004000 implements MigrationInterface {
  name = 'CreateAssets1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE asset_type AS ENUM (
        'motorcycle', 'car', 'phone', 'laptop', 'watch',
        'gold_jewelry', 'electronics', 'other'
      );
      CREATE TYPE asset_status AS ENUM (
        'holding', 'redeemed', 'overdue', 'pending_liquidation', 'liquidated'
      );
      CREATE TYPE asset_inventory_status AS ENUM ('in_storage', 'returned');

      CREATE TABLE assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        store_id UUID NOT NULL REFERENCES stores(id),
        asset_type asset_type NOT NULL,
        asset_name VARCHAR(255) NOT NULL,
        brand VARCHAR(100),
        model VARCHAR(100),
        color VARCHAR(50),
        serial_number VARCHAR(100),
        imei VARCHAR(50),
        license_plate VARCHAR(20),
        chassis_number VARCHAR(100),
        engine_number VARCHAR(100),
        condition_description TEXT,
        valuation_amount NUMERIC(18,2),
        proposed_loan_amount NUMERIC(18,2),
        status asset_status NOT NULL DEFAULT 'holding',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE asset_inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        store_id UUID NOT NULL REFERENCES stores(id),
        asset_id UUID NOT NULL REFERENCES assets(id),
        location_code VARCHAR(100),
        location_note TEXT,
        received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        returned_at TIMESTAMPTZ,
        status asset_inventory_status NOT NULL DEFAULT 'in_storage',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_assets_tenant_store_status ON assets(tenant_id, store_id, status);
      CREATE INDEX idx_assets_tenant_imei ON assets(tenant_id, imei);
      CREATE INDEX idx_assets_tenant_license_plate ON assets(tenant_id, license_plate);
      CREATE INDEX idx_assets_tenant_serial ON assets(tenant_id, serial_number);
      CREATE INDEX idx_asset_inventory_asset ON asset_inventory(asset_id);
      CREATE INDEX idx_asset_inventory_tenant_store ON asset_inventory(tenant_id, store_id, status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS asset_inventory;
      DROP TABLE IF EXISTS assets;
      DROP TYPE IF EXISTS asset_inventory_status;
      DROP TYPE IF EXISTS asset_status;
      DROP TYPE IF EXISTS asset_type;
    `);
  }
}
