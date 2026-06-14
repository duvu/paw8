/**
 * Contracts happy-path E2E tests against the live container.
 * Creates customer → asset → contract in sequence.
 */
import { api, login, DEMO_STORE_ID } from '../helpers/api-client';
import { uniqueTag } from '../helpers/seed';

const STAFF = { email: 'staff@demo.paw8.dev', password: 'Password@123' };
const MANAGER = { email: 'manager@demo.paw8.dev', password: 'Password@123' };

describe('Contracts — happy path', () => {
  let staffToken: string;
  let managerToken: string;
  let customerId: string;
  let assetId: string;
  let contractId: string;
  let contractCode: string;

  beforeAll(async () => {
    const [staffRes, managerRes] = await Promise.all([
      login(STAFF.email, STAFF.password),
      login(MANAGER.email, MANAGER.password),
    ]);
    staffToken = staffRes.accessToken;
    managerToken = managerRes.accessToken;
  });

  it('Setup: create customer for contract', async () => {
    const tag = uniqueTag();
    const res = await api('post', '/customers', staffToken).send({
      fullName: `Contract Customer ${tag}`,
      phone: `091${Date.now().toString().slice(-8)}`,
      identityNumber: `CID${Date.now().toString().slice(-9)}`,
    });
    expect(res.status).toBe(201);
    customerId = res.body.id;
  });

  it('Setup: create asset for contract', async () => {
    const tag = uniqueTag();
    const res = await api('post', '/assets', staffToken).send({
      assetType: 'motorcycle',
      assetName: `Honda Wave ${tag}`,
      brand: 'Honda',
      model: 'Wave Alpha',
      valuationAmount: 10000000,
      proposedLoanAmount: 7000000,
    });
    expect(res.status).toBe(201);
    assetId = res.body.id;
  });

  it('POST /contracts → 201 with contractCode', async () => {
    if (!customerId || !assetId) return;
    const startDate = new Date().toISOString();
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const res = await api('post', '/contracts', staffToken).send({
      storeId: DEMO_STORE_ID,
      customerId,
      assetIds: [assetId],
      principalAmount: 7000000,
      interestRate: 3,
      interestType: 'monthly',
      startDate,
      dueDate,
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('contract_code');
    expect(res.body.contract_code).toMatch(/HN01-\d{6}-\d+/);
    contractId = res.body.id;
    contractCode = res.body.contract_code;
  });

  it('GET /contracts → 200 with data array', async () => {
    const res = await api('get', '/contracts?limit=10&page=1', staffToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /contracts/:id → 200', async () => {
    if (!contractId) return;
    const res = await api('get', `/contracts/${contractId}`, staffToken);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(contractId);
    expect(res.body.contract_code).toBe(contractCode);
  });

  it('GET /contracts/upcoming-due → 200', async () => {
    const res = await api('get', '/contracts/upcoming-due', managerToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /contracts/overdue → 200', async () => {
    const res = await api('get', '/contracts/overdue', managerToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
