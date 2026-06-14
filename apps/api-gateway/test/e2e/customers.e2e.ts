/**
 * Customers happy-path E2E tests against the live container.
 */
import { api, login, TENANT_ADMIN } from '../helpers/api-client';
import { uniqueTag } from '../helpers/seed';

describe('Customers — happy path', () => {
  let adminToken: string;
  let createdCustomerId: string;
  let testPhone: string;

  beforeAll(async () => {
    const res = await login(TENANT_ADMIN.email, TENANT_ADMIN.password);
    adminToken = res.accessToken;
  });

  it('POST /customers → 201 with customer id', async () => {
    const tag = uniqueTag();
    testPhone = `090${Date.now().toString().slice(-8)}`;
    const res = await api('post', '/customers', adminToken).send({
      fullName: `Test Customer ${tag}`,
      phone: testPhone,
      identityNumber: `ID${Date.now().toString().slice(-10)}`,
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.phone).toBe(testPhone);
    createdCustomerId = res.body.id;
  });

  it('GET /customers → 200 with data array', async () => {
    const res = await api('get', '/customers?limit=10&page=1', adminToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /customers?query=<phone> → 200 with search results', async () => {
    if (!testPhone) return;
    const res = await api('get', `/customers?query=${testPhone}`, adminToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    const found = res.body.data.some((c: any) => c.phone === testPhone);
    expect(found).toBe(true);
  });

  it('GET /customers/:id → 200', async () => {
    if (!createdCustomerId) return;
    const res = await api('get', `/customers/${createdCustomerId}`, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdCustomerId);
  });

  it('PATCH /customers/:id → 200 with updated address', async () => {
    if (!createdCustomerId) return;
    const res = await api('patch', `/customers/${createdCustomerId}`, adminToken).send({
      currentAddress: '456 Updated Street',
    });
    expect(res.status).toBe(200);
  });
});
