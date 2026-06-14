import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMarketplaceTables1700000013000 implements MigrationInterface {
  name = 'CreateMarketplaceTables1700000013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'liquidation_sale'`);
    await queryRunner.query(`ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'extension'`);

    // marketplace_listings: tracks assets listed for public sale
    await queryRunner.query(`
      CREATE TYPE marketplace_listing_status AS ENUM ('draft', 'active', 'sold', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS marketplace_listings (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        store_id         UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        asset_id         UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        contract_id      UUID REFERENCES pawn_contracts(id) ON DELETE SET NULL,
        listing_price    NUMERIC(15,2) NOT NULL,
        status           marketplace_listing_status NOT NULL DEFAULT 'draft',
        title            VARCHAR(200) NOT NULL,
        description      TEXT,
        created_by       UUID NOT NULL REFERENCES users(id),
        updated_by       UUID REFERENCES users(id),
        sold_at          TIMESTAMPTZ,
        sold_price       NUMERIC(15,2),
        buyer_name       VARCHAR(200),
        buyer_phone      VARCHAR(20),
        buyer_id_number  VARCHAR(50),
        payment_method   VARCHAR(50),
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // buyer_inquiries: contact messages submitted by prospective buyers
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS buyer_inquiries (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        listing_id  UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
        buyer_name  VARCHAR(200) NOT NULL,
        buyer_phone VARCHAR(20) NOT NULL,
        buyer_email VARCHAR(200),
        message     TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_marketplace_listings_tenant_status
        ON marketplace_listings (tenant_id, status)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_marketplace_listings_tenant_asset
        ON marketplace_listings (tenant_id, asset_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_buyer_inquiries_listing_id
        ON buyer_inquiries (listing_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS buyer_inquiries`);
    await queryRunner.query(`DROP TABLE IF EXISTS marketplace_listings`);
    await queryRunner.query(`DROP TYPE IF EXISTS marketplace_listing_status`);
  }
}
