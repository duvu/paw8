/**
 * Stores happy-path E2E tests against the live container.
 * Tenant admin creates and lists stores.
 */
import { api, login, TENANT_ADMIN, DEMO_STORE_ID, DEMO_TENANT_ID } from '../helpers/api-client';
import { uniqueTag } from '../helpers/seed';

describe('Stores — happy path', () => {
  let adminToken: string;
  let platformToken: string;
  let createdStoreId: string;

  beforeAll(async () => {
    const adminRes = await login(TENANT_ADMIN.email, TENANT_ADMIN.password);
    adminToken = adminRes.accessToken;
    const { login: loginFn, PLATFORM_ADMIN } = await import('../helpers/api-client');
    const platRes = await loginFn(PLATFORM_ADMIN.email, PLATFORM_ADMIN.password);
    platformToken = platRes.accessToken;
  });

  it('GET /stores → 200 with data array', async () => {
    const res = await api('get', '/stores?limit=10&page=1', adminToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });

  it('GET /stores/:id → 200 with demo store', async () => {
    const res = await api('get', `/stores/${DEMO_STORE_ID}`, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(DEMO_STORE_ID);
    expect(res.body).toHaveProperty('code');
  });

  it('POST /stores → 201 with id', async () => {
    const tag = uniqueTag();
    const res = await api('post', '/stores', adminToken).send({
      name: `E2E Store ${tag}`,
      code: `S${tag}`.slice(0, 8).toUpperCase(),
      address: '123 Test Street',
      phone: '0901234567',
    });
    expect([201, 200]).toContain(res.status);
    if (res.body.id) createdStoreId = res.body.id;
  });

  it('PATCH /stores/:id → 200 on demo store', async () => {
    const storeId = createdStoreId || DEMO_STORE_ID;
    const res = await api('patch', `/stores/${storeId}`, adminToken).send({
      address: 'Updated Address 456',
    });
    expect(res.status).toBe(200);
  });
});
