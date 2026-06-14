/**
 * Users happy-path E2E tests against the live container.
 */
import { api, login, TENANT_ADMIN, PLATFORM_ADMIN, DEMO_TENANT_ID } from '../helpers/api-client';
import { uniqueTag } from '../helpers/seed';

describe('Users — happy path', () => {
  let adminToken: string;
  let platformToken: string;
  let createdUserId: string;

  beforeAll(async () => {
    const adminRes = await login(TENANT_ADMIN.email, TENANT_ADMIN.password);
    adminToken = adminRes.accessToken;
    const platRes = await login(PLATFORM_ADMIN.email, PLATFORM_ADMIN.password);
    platformToken = platRes.accessToken;
  });

  it('GET /users → 200 with data array (tenant scope)', async () => {
    const res = await api('get', '/users?limit=10&page=1', adminToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /users → 201 with new staff user', async () => {
    const tag = uniqueTag();
    const res = await api('post', '/users', adminToken).send({
      email: `staff.${tag}@test.paw8.dev`,
      password: 'Test@123456',
      fullName: `Staff User ${tag}`,
      role: 'staff',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toContain('@test.paw8.dev');
    createdUserId = res.body.id;
  });

  it('GET /users/:id → 200', async () => {
    if (!createdUserId) return;
    const res = await api('get', `/users/${createdUserId}`, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdUserId);
  });

  it('PATCH /users/:id → 200 with updated fullName', async () => {
    if (!createdUserId) return;
    const tag = uniqueTag();
    const res = await api('patch', `/users/${createdUserId}`, adminToken).send({
      fullName: `Updated Staff ${tag}`,
    });
    expect(res.status).toBe(200);
  });
});
