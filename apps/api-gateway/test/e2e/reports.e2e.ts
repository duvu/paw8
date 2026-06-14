/**
 * Reports happy-path E2E tests against the live container.
 * NOTE: reports/dashboard returns 500 until paw8-api is rebuilt with 'pawned' → 'holding' fix.
 */
import { api, login, TENANT_ADMIN } from '../helpers/api-client';

describe('Reports — happy path', () => {
  let adminToken: string;

  beforeAll(async () => {
    const res = await login(TENANT_ADMIN.email, TENANT_ADMIN.password);
    adminToken = res.accessToken;
  });

  it('GET /reports/dashboard → 200 with summary metrics', async () => {
    const res = await api('get', '/reports/dashboard', adminToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('activeContracts');
    expect(res.body).toHaveProperty('totalOutstandingPrincipal');
  });

  it('GET /reports/stores → 200', async () => {
    const res = await api('get', '/reports/stores', adminToken);
    expect(res.status).toBe(200);
  });

  it('GET /reports/assets/inventory → 200', async () => {
    const res = await api('get', '/reports/assets/inventory', adminToken);
    expect(res.status).toBe(200);
  });

  it('GET /reports/staff → 200', async () => {
    const res = await api('get', '/reports/staff', adminToken);
    expect(res.status).toBe(200);
  });
});
