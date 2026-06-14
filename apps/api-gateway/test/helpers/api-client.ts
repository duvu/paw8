/**
 * Thin supertest wrapper for happy-path E2E tests against the live container.
 * Targets http://10.113.213.9:3028 by default.
 */
import * as supertest from 'supertest';

export const BASE_URL = process.env.API_BASE_URL || 'http://10.113.213.9:3028';

export type HttpMethod = 'get' | 'post' | 'patch' | 'put' | 'delete';

export function api(method: HttpMethod, path: string, token?: string) {
  const req = (supertest as any).agent(BASE_URL)[method](`/api/v1${path}`);
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  req.set('Content-Type', 'application/json');
  return req;
}

export async function login(email: string, password: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const res = await api('post', '/auth/login').send({ email, password });
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(
      `Login failed for ${email}: status=${res.status} body=${JSON.stringify(res.body)}`,
    );
  }
  return res.body as any;
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

/** Platform admin credentials (pre-seeded) */
export const PLATFORM_ADMIN = {
  email: 'platform@paw8.dev',
  password: 'Password@123',
};

/** Tenant admin credentials (pre-seeded, belongs to Demo tenant) */
export const TENANT_ADMIN = {
  email: 'admin@demo.paw8.dev',
  password: 'Password@123',
};

export const DEMO_TENANT_ID = 'c9d432ea-9d9a-40e3-b2fd-097a06739169';
export const DEMO_STORE_ID = '2a66d000-c130-4de1-ba15-ca7a94c0b88c';
export const DEMO_STORE_CODE = 'HN01';
