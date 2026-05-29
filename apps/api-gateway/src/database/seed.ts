/**
 * Seed script — creates one tenant, one store, and one user per role.
 * Run: pnpm seed (from apps/api-gateway)
 */
import { AppDataSource } from './data-source';
import * as bcrypt from 'bcrypt';

async function seed() {
  await AppDataSource.initialize();
  const q = AppDataSource.createQueryRunner();
  await q.connect();
  await q.startTransaction();

  try {
    // 1. Tenant
    const tenants = await q.query(`
      INSERT INTO tenants (id, name, code, status, plan, max_stores, max_users)
      VALUES (gen_random_uuid(), 'Demo Pawn Shop', 'DEMO', 'active', 'pro', 10, 50)
      ON CONFLICT (code) DO NOTHING
      RETURNING id
    `);
    const tenantId = tenants[0]?.id ?? (await q.query(`SELECT id FROM tenants WHERE code='DEMO'`))[0].id;

    // 2. Store
    const stores = await q.query(`
      INSERT INTO stores (id, tenant_id, name, code, address, phone, status)
      VALUES (gen_random_uuid(), $1, 'Cửa hàng 1 - Hà Nội', 'HN01', '123 Đường ABC, Hà Nội', '0901234567', 'active')
      ON CONFLICT (tenant_id, code) DO NOTHING
      RETURNING id
    `, [tenantId]);
    const storeId = stores[0]?.id ?? (await q.query(`SELECT id FROM stores WHERE tenant_id=$1 AND code='HN01'`, [tenantId]))[0].id;

    // 3. Roles
    const roleNames = ['platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant'];
    const roleIds: Record<string, string> = {};
    for (const name of roleNames) {
      const rs = await q.query(`
        INSERT INTO roles (id, tenant_id, name)
        VALUES (gen_random_uuid(), $1, $2)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [name === 'platform_admin' ? null : tenantId, name]);
      const id = rs[0]?.id ?? (await q.query(`SELECT id FROM roles WHERE name=$1 AND (tenant_id=$2 OR tenant_id IS NULL)`, [name, tenantId]))[0]?.id;
      if (id) roleIds[name] = id;
    }

    // 4. Users
    const users = [
      { email: 'platform@paw8.dev', name: 'Platform Admin', role: 'platform_admin', tenantId: null },
      { email: 'owner@demo.paw8.dev', name: 'Tenant Owner', role: 'tenant_owner', tenantId },
      { email: 'admin@demo.paw8.dev', name: 'Tenant Admin', role: 'tenant_admin', tenantId },
      { email: 'manager@demo.paw8.dev', name: 'Store Manager', role: 'store_manager', tenantId },
      { email: 'staff@demo.paw8.dev', name: 'Staff User', role: 'staff', tenantId },
      { email: 'accountant@demo.paw8.dev', name: 'Accountant', role: 'accountant', tenantId },
    ];

    const passwordHash = await bcrypt.hash('Password@123', 12);

    for (const u of users) {
      const rs = await q.query(`
        INSERT INTO users (id, tenant_id, email, full_name, password_hash, status)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, 'active')
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [u.tenantId, u.email, u.name, passwordHash]);
      const userId = rs[0]?.id ?? (await q.query(`SELECT id FROM users WHERE email=$1`, [u.email]))[0]?.id;
      if (!userId) continue;

      // Assign role
      if (roleIds[u.role]) {
        await q.query(`
          INSERT INTO user_roles (id, tenant_id, user_id, role_id)
          VALUES (gen_random_uuid(), $1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [u.tenantId, userId, roleIds[u.role]]);
      }

      // Assign store for store-scoped roles
      if (['store_manager', 'staff', 'accountant'].includes(u.role)) {
        await q.query(`
          INSERT INTO user_store_assignments (id, tenant_id, user_id, store_id)
          VALUES (gen_random_uuid(), $1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [tenantId, userId, storeId]);
      }
    }

    await q.commitTransaction();
    console.log('✅ Seed complete!');
    console.log('  Tenant:', tenantId);
    console.log('  Store:', storeId);
    console.log('  Users: platform@paw8.dev, owner@demo.paw8.dev, admin@demo.paw8.dev, manager@demo.paw8.dev, staff@demo.paw8.dev, accountant@demo.paw8.dev');
    console.log('  Password for all: Password@123');
  } catch (err) {
    await q.rollbackTransaction();
    throw err;
  } finally {
    await q.release();
    await AppDataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
