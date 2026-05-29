import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoresUsersRolesAssignments1700000002000
  implements MigrationInterface
{
  name = 'CreateStoresUsersRolesAssignments1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE store_status AS ENUM ('active', 'locked');
      CREATE TYPE user_status AS ENUM ('active', 'locked');

      CREATE TABLE stores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        manager_user_id UUID,
        status store_status NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(tenant_id, code)
      );

      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        full_name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        status user_status NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(tenant_id, email)
      );

      -- Platform admin users (no tenant)
      ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        UNIQUE(user_id, role_id)
      );

      CREATE TABLE user_store_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        UNIQUE(user_id, store_id)
      );

      -- Add FK for manager after users table exists
      ALTER TABLE stores
        ADD CONSTRAINT fk_stores_manager FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL;

      CREATE INDEX idx_stores_tenant_status ON stores(tenant_id, status);
      CREATE INDEX idx_users_tenant_status ON users(tenant_id, status);
      CREATE INDEX idx_user_roles_user ON user_roles(user_id);
      CREATE INDEX idx_user_store_assignments_user ON user_store_assignments(user_id, store_id);
      CREATE INDEX idx_user_store_assignments_store ON user_store_assignments(store_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS user_store_assignments;
      DROP TABLE IF EXISTS user_roles;
      DROP TABLE IF EXISTS roles;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS stores;
      DROP TYPE IF EXISTS user_status;
      DROP TYPE IF EXISTS store_status;
    `);
  }
}
