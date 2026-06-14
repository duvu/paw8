/**
 * Assets happy-path E2E tests against the live container.
 * IMPORTANT: Must use staff credentials — storeId is derived from allowedStoreIds[0].
 */
import { api, login } from '../helpers/api-client';
import { uniqueTag } from '../helpers/seed';

const STAFF = { email: 'staff@demo.paw8.dev', password: 'Password@123' };
const MANAGER = { email: 'manager@demo.paw8.dev', password: 'Password@123' };

describe('Assets — happy path', () => {
  let staffToken: string;
  let createdAssetId: string;

  beforeAll(async () => {
    const res = await login(STAFF.email, STAFF.password);
    staffToken = res.accessToken;
  });

  it('POST /assets → 201 with id and storeId', async () => {
    const tag = uniqueTag();
    const res = await api('post', '/assets', staffToken).send({
      assetType: 'phone',
      assetName: `iPhone Test ${tag}`,
      brand: 'Apple',
      model: 'iPhone 14',
      conditionDescription: 'Good condition',
      valuationAmount: 5000000,
      proposedLoanAmount: 3000000,
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('storeId');
    expect(res.body.assetType).toBe('phone');
    createdAssetId = res.body.id;
  });

  it('GET /assets → 200 with data array', async () => {
    const res = await api('get', '/assets?limit=10&page=1', staffToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /assets/:id → 200', async () => {
    if (!createdAssetId) return;
    const res = await api('get', `/assets/${createdAssetId}`, staffToken);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdAssetId);
  });

  it('PATCH /assets/:id → 200 with updated condition', async () => {
    if (!createdAssetId) return;
    const res = await api('patch', `/assets/${createdAssetId}`, staffToken).send({
      conditionDescription: 'Fair condition — minor scratches',
    });
    expect(res.status).toBe(200);
  });
});
