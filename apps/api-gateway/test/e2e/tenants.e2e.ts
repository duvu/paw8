/**
 * Tenants happy-path E2E tests against the live container.
 * Platform admin creates, reads, updates tenants.
 */
import { api, login, PLATFORM_ADMIN, DEMO_TENANT_ID } from '../helpers/api-client';
import { uniqueTag } from '../helpers/seed';

describe('Tenants — happy path', () => {
  let platformToken: string;
  let createdTenantId: string;

  beforeAll(async () => {
    const res = await login(PLATFORM_ADMIN.email, PLATFORM_ADMIN.password);
    platformToken = res.accessToken;
  });

  it('POST /tenants → 201 with id', async () => {
    const tag = uniqueTag();
    const res = await api('post', '/tenants', platformToken).send({
      name: `E2E Tenant ${tag}`,
      code: `E2E${tag}`.slice(0, 10).toUpperCase(),
      plan: 'trial',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toContain('E2E Tenant');
    createdTenantId = res.body.id;
  });

  it('GET /tenants → 200 with data array', async () => {
    const res = await api('get', '/tenants', platformToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });

  it('GET /tenants/:id → 200 with demo tenant', async () => {
    const res = await api('get', `/tenants/${DEMO_TENANT_ID}`, platformToken);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(DEMO_TENANT_ID);
  });

  it('PATCH /tenants/:id → 200 with updated name', async () => {
    if (!createdTenantId) return;
    const tag = uniqueTag();
    const res = await api('patch', `/tenants/${createdTenantId}`, platformToken).send({
      name: `Updated Tenant ${tag}`,
    });
    expect(res.status).toBe(200);
    expect(res.body[0].name).toContain('Updated Tenant');
  });
});
