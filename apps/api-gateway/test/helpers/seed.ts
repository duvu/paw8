/**
 * Seed helpers for E2E tests.
 * Creates isolated test data per suite using platform admin credentials.
 * Each call produces a unique tenant+store+admin combo via timestamp suffix.
 */
import { api, login, PLATFORM_ADMIN, TENANT_ADMIN, DEMO_TENANT_ID, DEMO_STORE_ID } from './api-client';

export interface SuiteContext {
  tenantId: string;
  storeId: string;
  adminToken: string;
  storeCode: string;
}

/**
 * Returns a pre-seeded demo suite context (reuses the existing demo tenant/store).
 * Fast — no new DB rows, always works as long as seed data is present.
 */
export async function getDemoContext(): Promise<SuiteContext> {
  const { accessToken } = await login(TENANT_ADMIN.email, TENANT_ADMIN.password);
  return {
    tenantId: DEMO_TENANT_ID,
    storeId: DEMO_STORE_ID,
    adminToken: accessToken,
    storeCode: 'HN01',
  };
}

/**
 * Creates a fresh isolated tenant+store+admin via platform admin.
 * Use this when tests must avoid demo-data pollution.
 */
export async function createIsolatedContext(tag: string): Promise<SuiteContext & { platformToken: string }> {
  const { accessToken: platformToken } = await login(PLATFORM_ADMIN.email, PLATFORM_ADMIN.password);

  const code = `T${tag}`.slice(0, 10).toUpperCase();

  // Create tenant
  const tenantRes = await api('post', '/tenants', platformToken).send({
    name: `Test Tenant ${tag}`,
    code,
      plan: 'trial',
  });
  if (tenantRes.status !== 201) {
    throw new Error(`Create tenant failed: ${JSON.stringify(tenantRes.body)}`);
  }
  const tenantId: string = tenantRes.body.id;

  // Create admin user for the tenant
  const adminEmail = `admin.${tag}@test.paw8.dev`;
  const userRes = await api('post', '/users', platformToken).send({
    email: adminEmail,
    password: 'Test@123456',
    fullName: `Admin ${tag}`,
    role: 'tenant_admin',
    tenantId,
  });
  if (userRes.status !== 201) {
    throw new Error(`Create user failed: ${JSON.stringify(userRes.body)}`);
  }

  // Create store
  const storeCode = `S${tag}`.slice(0, 8).toUpperCase();
  const storeRes = await api('post', '/stores', platformToken).send({
    name: `Store ${tag}`,
    code: storeCode,
  });
  if (storeRes.status !== 201) {
    throw new Error(`Create store failed: ${JSON.stringify(storeRes.body)}`);
  }
  const storeId: string = storeRes.body.id;

  // Login as the new admin
  const { accessToken: adminToken } = await login(adminEmail, 'Test@123456');

  return { tenantId, storeId, adminToken, storeCode, platformToken };
}

/** Generate a unique suffix from current timestamp */
export function uniqueTag(): string {
  return Date.now().toString(36).toUpperCase();
}
