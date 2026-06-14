/**
 * Files happy-path E2E tests against the live container.
 * Tests: upload-url → confirm → download-url → list → delete.
 */
import { api, login, TENANT_ADMIN, DEMO_TENANT_ID } from '../helpers/api-client';
import { uniqueTag } from '../helpers/seed';

describe('Files — happy path', () => {
  let adminToken: string;
  let customerId: string;
  let fileId: string;
  let objectKey: string;

  beforeAll(async () => {
    const res = await login(TENANT_ADMIN.email, TENANT_ADMIN.password);
    adminToken = res.accessToken;

    // Create a customer to attach file to
    const tag = uniqueTag();
    const custRes = await api('post', '/customers', adminToken).send({
      fullName: `File Customer ${tag}`,
      phone: `093${Date.now().toString().slice(-8)}`,
      identityNumber: `FID${Date.now().toString().slice(-9)}`,
    });
    customerId = custRes.body.id;
  });

  it('POST /files/upload-url → 200 with uploadUrl and objectKey', async () => {
    if (!customerId) return;
    const res = await api('post', '/files/upload-url', adminToken).send({
      entityType: 'customer',
      entityId: customerId,
      originalFilename: 'id-front.jpg',
      mimeType: 'image/jpeg',
      fileSize: 102400,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('uploadUrl');
    expect(res.body).toHaveProperty('objectKey');
    objectKey = res.body.objectKey;
  });

  it('POST /files/confirm → 201 with file id', async () => {
    if (!objectKey) return;
    const res = await api('post', '/files/confirm', adminToken).send({
      uploadToken: objectKey,
      fileSize: 102400,
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    fileId = res.body.id;
  });

  it('GET /files/entity/customer/:customerId → 200 with files list', async () => {
    if (!customerId) return;
    const res = await api('get', `/files/entity/customer/${customerId}`, adminToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /files/:id/download-url → 200 with downloadUrl', async () => {
    if (!fileId) return;
    const res = await api('get', `/files/${fileId}/download-url`, adminToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('downloadUrl');
  });

  it('DELETE /files/:id → 200 or 204', async () => {
    if (!fileId) return;
    const res = await api('delete', `/files/${fileId}`, adminToken);
    expect([200, 204]).toContain(res.status);
  });
});
