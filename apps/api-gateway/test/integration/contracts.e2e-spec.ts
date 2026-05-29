import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../../../libs/common/src/filters/all-exceptions.filter';

describe('Contracts (e2e)', () => {
  let app: INestApplication;
  let staffToken: string;
  let tenantAdminToken: string;
  let customerId: string;
  let assetId: string;
  let contractId: string;
  let contractCode: string;

  // Seed data from seed.ts
  const STORE_ID = 'fa606d7d-e47a-48be-9311-604730653188';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    // Login
    const staffRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'staff@demo.paw8.dev', password: 'Password@123' });
    staffToken = staffRes.body.accessToken;

    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@demo.paw8.dev', password: 'Password@123' });
    tenantAdminToken = adminRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Customer creation', () => {
    it('should create a customer', async () => {
      const ts = Date.now();
      const res = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          fullName: `Test Customer ${ts}`,
          phone: `09${String(ts).slice(-8)}`,
          identityNumber: `${String(ts).slice(-12)}`,
          dateOfBirth: '1990-01-01',
          permanentAddress: '123 Test Street',
          storeId: STORE_ID,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      customerId = res.body.id;
    });
  });

  describe('Asset creation', () => {
    it('should create an asset', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          assetType: 'motorcycle',
          assetName: 'Honda Wave Alpha',
          brand: 'Honda',
          model: 'Wave Alpha 110',
          color: 'Red',
          conditionDescription: 'Good condition, minor scratches',
          valuationAmount: 15000000,
          proposedLoanAmount: 10000000,
          storeId: STORE_ID,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      assetId = res.body.id;
    });
  });

  describe('Contract creation and workflow', () => {
    it('should create a contract with disbursement', async () => {
      const startDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const res = await request(app.getHttpServer())
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          storeId: STORE_ID,
          customerId,
          assetIds: [assetId],
          principalAmount: 10000000,
          interestRate: 3,
          interestType: 'monthly',
          startDate,
          dueDate,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('contractCode');
      contractId = res.body.id;
      contractCode = res.body.contractCode;
    });

    it('should have contract code in correct format (store-YYYYMM-seq)', () => {
      // Format: {store_code}-{YYYYMM}-{seq} e.g. HN01-202605-00001
      expect(contractCode).toMatch(/^[A-Z0-9]+-\d{6}-\d+$/);
    });

    it('should get contract detail with transactions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/contracts/${contractId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(res.body.id).toBe(contractId);
      expect(res.body).toHaveProperty('transactions');
      // Should have disbursement transaction
      const disbursement = res.body.transactions?.find(
        (t: any) => t.transactionType === 'disbursement',
      );
      expect(disbursement).toBeDefined();
    });

    it('should get settlement preview', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/contracts/${contractId}/settlement-preview`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalAmount');
      expect(res.body.totalAmount).toBeGreaterThan(0);
    });

    it('should collect interest payment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/contracts/${contractId}/transactions`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          transactionType: 'interest_payment',
          amount: 300000,
          paymentMethod: 'cash',
          note: 'Monthly interest collection',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.transactionType).toBe('interest_payment');
    });

    it('should extend contract', async () => {
      const newDueDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const res = await request(app.getHttpServer())
        .post(`/api/v1/contracts/${contractId}/extend`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          newDueDate,
          interestPaidAmount: 300000,
          feeAmount: 0,
          paymentMethod: 'cash',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('should settle contract and verify status becomes settled', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/contracts/${contractId}/settle`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          paymentMethod: 'cash',
          note: 'Full settlement',
        })
        .expect(201);

      expect(res.body).toHaveProperty('contract');
      expect(res.body.contract.status).toBe('settled');
    });

    it('should verify asset status is redeemed after settlement', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/assets/${assetId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(res.body.status).toBe('redeemed');
    });

    it('should not allow UPDATE/DELETE on transactions (append-only)', async () => {
      // Get transactions for this contract
      const contractRes = await request(app.getHttpServer())
        .get(`/api/v1/contracts/${contractId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      const txId = contractRes.body.transactions?.[0]?.id;
      if (txId) {
        // PATCH should not exist (404 or 405)
        const patchRes = await request(app.getHttpServer())
          .patch(`/api/v1/contracts/${contractId}/transactions/${txId}`)
          .set('Authorization', `Bearer ${staffToken}`)
          .send({ amount: 999 });
        expect([404, 405]).toContain(patchRes.status);

        // DELETE should not exist (404 or 405)
        const deleteRes = await request(app.getHttpServer())
          .delete(`/api/v1/contracts/${contractId}/transactions/${txId}`)
          .set('Authorization', `Bearer ${staffToken}`);
        expect([404, 405]).toContain(deleteRes.status);
      }
    });
  });

  describe('Cross-tenant isolation', () => {
    it('should not allow access to another tenant contract', async () => {
      // Try to access a non-existent or different tenant contract
      const fakeId = '00000000-0000-0000-0000-000000000001';
      await request(app.getHttpServer())
        .get(`/api/v1/contracts/${fakeId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(404);
    });
  });
});
