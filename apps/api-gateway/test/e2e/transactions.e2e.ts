/**
 * Transactions happy-path E2E tests against the live container.
 * Creates full lifecycle: contract → disbursement → interest collection → settlement calc.
 */
import { api, login, DEMO_STORE_ID } from '../helpers/api-client';
import { uniqueTag } from '../helpers/seed';

const STAFF = { email: 'staff@demo.paw8.dev', password: 'Password@123' };

describe('Transactions — happy path', () => {
  let staffToken: string;
  let customerId: string;
  let assetId: string;
  let contractId: string;
  let disbursementTxId: string;

  beforeAll(async () => {
    const res = await login(STAFF.email, STAFF.password);
    staffToken = res.accessToken;

    // Create customer
    const tag = uniqueTag();
    const custRes = await api('post', '/customers', staffToken).send({
      fullName: `Txn Customer ${tag}`,
      phone: `092${Date.now().toString().slice(-8)}`,
      identityNumber: `TID${Date.now().toString().slice(-9)}`,
    });
    customerId = custRes.body.id;

    // Create asset
    const assetRes = await api('post', '/assets', staffToken).send({
      assetType: 'laptop',
      assetName: `Laptop ${tag}`,
      valuationAmount: 8000000,
      proposedLoanAmount: 5000000,
    });
    assetId = assetRes.body.id;

    // Create contract
    const startDate = new Date().toISOString();
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const contractRes = await api('post', '/contracts', staffToken).send({
      storeId: DEMO_STORE_ID,
      customerId,
      assetIds: [assetId],
      principalAmount: 5000000,
      interestRate: 3,
      interestType: 'monthly',
      startDate,
      dueDate,
    });
    contractId = contractRes.body.id;
  });

  it('POST /transactions (disbursement) → 201', async () => {
    if (!contractId) return;
    const res = await api('post', '/transactions', staffToken).send({
      contractId,
      transactionType: 'disbursement',
      amount: 5000000,
      paymentMethod: 'cash',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('transaction');
    expect(res.body.transaction).toHaveProperty('id');
    expect(res.body.transaction.transaction_type).toBe('disbursement');
    disbursementTxId = res.body.transaction.id;
  });

  it('POST /transactions (interest_collection) → 201', async () => {
    if (!contractId) return;
    const res = await api('post', '/transactions', staffToken).send({
      contractId,
      transactionType: 'interest_collection',
      amount: 150000,
      paymentMethod: 'cash',
    });
    expect(res.status).toBe(201);
    expect(res.body.transaction.transaction_type).toBe('interest_collection');
  });

  it('GET /transactions/contract/:contractId → 200 with list', async () => {
    if (!contractId) return;
    const res = await api('get', `/transactions/contract/${contractId}`, staffToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /transactions/calculate-settlement → 201 with amount', async () => {
    if (!contractId) return;
    const res = await api('post', '/transactions/calculate-settlement', staffToken).send({
      contractId,
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('totalDue');
  });
});
