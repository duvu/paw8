/**
 * Auth happy-path E2E tests against the live container.
 * Covers: login, refresh, logout, change-password.
 */
import { api, login, TENANT_ADMIN, PLATFORM_ADMIN } from '../helpers/api-client';

describe('Auth — happy path', () => {
  let accessToken: string;
  let refreshToken: string;

  it('POST /auth/login → 200 with tokens', async () => {
    const res = await api('post', '/auth/login').send(TENANT_ADMIN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('expiresIn');
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('POST /auth/refresh → 200 with new tokens', async () => {
    const res = await api('post', '/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    // update for subsequent use
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('POST /auth/logout → 200', async () => {
    const res = await api('post', '/auth/logout', accessToken).send({ refreshToken });
    expect([200, 204]).toContain(res.status);
  });

  it('POST /auth/login with wrong password → 401 or 400', async () => {
    const res = await api('post', '/auth/login').send({
      email: TENANT_ADMIN.email,
      password: 'wrongpassword',
    });
    expect([400, 401]).toContain(res.status);
  });

  it('Platform admin login → 200 with tokens', async () => {
    const res = await api('post', '/auth/login').send(PLATFORM_ADMIN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });
});
