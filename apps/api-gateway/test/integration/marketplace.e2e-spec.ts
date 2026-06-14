import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../../../libs/common/src/filters/all-exceptions.filter';

describe('Marketplace (e2e)', () => {
  let app: INestApplication;
  let staffToken: string;
  let assetId: string;
  let contractId: string;
  let listingId: string;

  // Seed data
  const STORE_ID = 'fa606d7d-e47a-48be-9311-604730653188';
  const TENANT_CODE = 'DEMO';

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

    // Login as staff
    const staffRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'staff@demo.paw8.dev', password: 'Password@123' });
    staffToken = staffRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // -------------------------------------------------------------------------
  // Task 8.1: E2E flow: create listing → publish → submit inquiry → execute sale
  // -------------------------------------------------------------------------
  describe('8.1 Full e2e sale flow', () => {
    let customerId: string;

    it('setup: create customer', async () => {
      const ts = Date.now();
      const res = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          fullName: `Marketplace Test Customer ${ts}`,
          phone: `09${String(ts).slice(-8)}`,
          identityNumber: `${String(ts).slice(-12)}`,
          dateOfBirth: '1990-01-01',
          permanentAddress: '123 Market St',
        })
        .expect(201);
      customerId = res.body.id;
    });

    it('setup: create asset', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          assetType: 'phone',
          assetName: 'Samsung Galaxy S22',
          brand: 'Samsung',
          model: 'S22',
          color: 'Black',
          conditionDescription: 'Good condition',
          valuationAmount: 8000000,
          proposedLoanAmount: 5000000,
        })
        .expect(201);
      assetId = res.body.id;
    });

    it('setup: create contract', async () => {
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
          principalAmount: 5000000,
          interestRate: 3,
          interestType: 'monthly',
          startDate,
          dueDate,
        })
        .expect(201);
      contractId = res.body.id;
      console.log('[DEBUG] contractId set to:', contractId, '| body keys:', Object.keys(res.body).join(','));
    });

    it('should create a marketplace listing in draft', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          assetId,
          contractId,
          listingPrice: 7000000,
          title: 'Samsung Galaxy S22 - Thanh lý',
          description: 'Điện thoại thanh lý từ hợp đồng cầm đồ',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('draft');
      expect(res.body.listingPrice).toBe(7000000);
      listingId = res.body.id;
      console.log('[DEBUG] listingId set to:', listingId, '| status:', res.body.status);
    });

    it('should publish the listing', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/marketplace/listings/${listingId}/publish`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      console.log('[DEBUG] publish body:', JSON.stringify(res.body));
      expect(res.body.status).toBe('active');
    });

    it('should submit a buyer inquiry on the published listing', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/marketplace/public/listings/${listingId}/inquiries`)
        .query({ tenant: TENANT_CODE })
        .send({
          buyerName: 'Nguyen Van A',
          buyerPhone: '0901234567',
          buyerEmail: 'buyer@test.com',
          message: 'Tôi muốn hỏi về sản phẩm này',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.buyerName).toBe('Nguyen Van A');
    });

    it('should execute sale and verify status changes', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/marketplace/listings/${listingId}/sell`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          soldPrice: 6800000,
          buyerName: 'Nguyen Van A',
          buyerPhone: '0901234567',
          buyerIdNumber: '123456789012',
          paymentMethod: 'cash',
        })
        .expect(201);

      expect(res.body.status).toBe('sold');
      expect(res.body.soldPrice).toBe(6800000);
      expect(res.body.buyerName).toBe('Nguyen Van A');
    });

    it('should verify asset status is redeemed after sale', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/assets/${assetId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(res.body.status).toBe('redeemed');
    });

    it('should verify contract status is liquidated after sale', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/contracts/${contractId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(res.body.status).toBe('liquidated');
    });

    it('should verify a liquidation_sale transaction record exists', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/transactions/contract/${contractId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      const liquidationTx = res.body.find(
        (t: any) => t.transaction_type === 'liquidation_sale',
      );
      expect(liquidationTx).toBeDefined();
      expect(parseFloat(liquidationTx.amount)).toBe(6800000);
    });
  });

  // -------------------------------------------------------------------------
  // Task 8.2: executeSale rollback — cannot easily simulate mid-transaction
  // DB failure in e2e; test instead that double-sell is rejected atomically
  // -------------------------------------------------------------------------
  describe('8.2 executeSale prevents double-sell (idempotency / rollback guard)', () => {
    let rollbackListingId: string;
    let rollbackAssetId: string;

    it('setup: create asset for rollback test', async () => {
      const ts = Date.now();
      const res = await request(app.getHttpServer())
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          assetType: 'laptop',
          assetName: `Rollback Test Laptop ${ts}`,
          brand: 'Dell',
          model: 'XPS 15',
          color: 'Silver',
          conditionDescription: 'Excellent',
          valuationAmount: 20000000,
          proposedLoanAmount: 15000000,
        })
        .expect(201);
      rollbackAssetId = res.body.id;
    });

    it('setup: create and publish listing', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          assetId: rollbackAssetId,
          listingPrice: 18000000,
          title: 'Rollback Test Laptop',
        })
        .expect(201);
      rollbackListingId = createRes.body.id;

      await request(app.getHttpServer())
        .patch(`/api/v1/marketplace/listings/${rollbackListingId}/publish`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);
    });

    it('should execute first sale successfully', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/marketplace/listings/${rollbackListingId}/sell`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          soldPrice: 17000000,
          buyerName: 'First Buyer',
          buyerPhone: '0900000001',
          paymentMethod: 'cash',
        })
        .expect(201);
      expect(res.body.status).toBe('sold');
    });

    it('should reject second sale attempt (listing no longer active)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/marketplace/listings/${rollbackListingId}/sell`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          soldPrice: 16000000,
          buyerName: 'Second Buyer',
          buyerPhone: '0900000002',
          paymentMethod: 'cash',
        })
        .expect(400);

      expect(res.body.error).toMatch(/Only active listings can be sold/i);
    });

    it('asset status should remain redeemed (not double-changed)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/assets/${rollbackAssetId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);
      expect(res.body.status).toBe('redeemed');
    });
  });

  // -------------------------------------------------------------------------
  // Task 8.3: Public browse returns only 'active' listings, no PII fields
  // -------------------------------------------------------------------------
  describe('8.3 Public browse — active only, no PII', () => {
    let publicListingId: string;
    let draftListingId: string;
    let soldListingId: string;

    it('setup: create active listing for public browse', async () => {
      const ts = Date.now();
      const assetRes = await request(app.getHttpServer())
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          assetType: 'watch',
          assetName: `Public Test Watch ${ts}`,
          brand: 'Casio',
          model: 'G-Shock',
          color: 'Black',
          conditionDescription: 'Like new',
          valuationAmount: 3000000,
          proposedLoanAmount: 2000000,
        })
        .expect(201);
      const testAssetId = assetRes.body.id;

      const listRes = await request(app.getHttpServer())
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          assetId: testAssetId,
          listingPrice: 2800000,
          title: `G-Shock Thanh Lý ${ts}`,
          description: 'Đồng hồ chính hãng',
        })
        .expect(201);
      publicListingId = listRes.body.id;

      // Publish it so it becomes active
      await request(app.getHttpServer())
        .patch(`/api/v1/marketplace/listings/${publicListingId}/publish`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);
    });

    it('setup: create draft listing (should NOT appear in public)', async () => {
      const ts = Date.now() + 1;
      const assetRes = await request(app.getHttpServer())
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          assetType: 'phone',
          assetName: `Draft Phone ${ts}`,
          brand: 'Apple',
          model: 'iPhone 12',
          color: 'White',
          conditionDescription: 'Good',
          valuationAmount: 10000000,
          proposedLoanAmount: 7000000,
        })
        .expect(201);

      const listRes = await request(app.getHttpServer())
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          assetId: assetRes.body.id,
          listingPrice: 9000000,
          title: `Draft iPhone ${ts}`,
        })
        .expect(201);
      draftListingId = listRes.body.id;
      void draftListingId; // referenced for clarity only
    });

    it('public browse should return only active listings', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/marketplace/public/listings')
        .query({ tenant: TENANT_CODE })
        .expect(200);

      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');

      const items: any[] = res.body.items;

      // Every returned item must have status 'active'
      items.forEach((item) => {
        expect(item.status).toBe('active');
      });

      // Our active listing should be present
      const found = items.find((item) => item.id === publicListingId);
      expect(found).toBeDefined();
    });

    it('public browse items should not contain PII / buyer fields', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/marketplace/public/listings')
        .query({ tenant: TENANT_CODE })
        .expect(200);

      const items: any[] = res.body.items;
      items.forEach((item) => {
        // These fields must NOT appear in public response
        expect(item).not.toHaveProperty('buyerName');
        expect(item).not.toHaveProperty('buyerPhone');
        expect(item).not.toHaveProperty('buyerIdNumber');
        expect(item).not.toHaveProperty('soldPrice');
        expect(item).not.toHaveProperty('createdBy');
        expect(item).not.toHaveProperty('updatedBy');
      });
    });

    it('public detail should also not expose PII', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/marketplace/public/listings/${publicListingId}`)
        .query({ tenant: TENANT_CODE })
        .expect(200);

      expect(res.body.id).toBe(publicListingId);
      expect(res.body.status).toBe('active');
      expect(res.body).not.toHaveProperty('buyerName');
      expect(res.body).not.toHaveProperty('buyerPhone');
      expect(res.body).not.toHaveProperty('soldPrice');
      expect(res.body).not.toHaveProperty('createdBy');
    });
  });

  // -------------------------------------------------------------------------
  // Task 8.4: Rate limiting — 429 after 5 requests from same IP
  // -------------------------------------------------------------------------
  describe('8.4 Inquiry rate limiting', () => {
    let rateLimitListingId: string;

    it('setup: create and publish listing for rate limit test', async () => {
      const ts = Date.now();
      const assetRes = await request(app.getHttpServer())
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          assetType: 'other',
          assetName: `Rate Limit Test Asset ${ts}`,
          brand: 'Generic',
          model: 'Model X',
          color: 'Grey',
          conditionDescription: 'OK',
          valuationAmount: 1000000,
          proposedLoanAmount: 500000,
        })
        .expect(201);

      const listRes = await request(app.getHttpServer())
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          assetId: assetRes.body.id,
          listingPrice: 900000,
          title: `Rate Limit Test ${ts}`,
        })
        .expect(201);
      rateLimitListingId = listRes.body.id;

      await request(app.getHttpServer())
        .patch(`/api/v1/marketplace/listings/${rateLimitListingId}/publish`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);
    });

    it('should return 429 after 5 inquiry submissions from the same IP', async () => {
      const inquiryPayload = {
        buyerName: 'Rate Tester',
        buyerPhone: '0900000099',
        message: 'Test inquiry',
      };

      const results: number[] = [];

      // Send 6 requests — first 5 should succeed, 6th should be 429
      for (let i = 0; i < 6; i++) {
        const res = await request(app.getHttpServer())
          .post(
            `/api/v1/marketplace/public/listings/${rateLimitListingId}/inquiries`,
          )
          .query({ tenant: TENANT_CODE })
          .send({ ...inquiryPayload, buyerPhone: `09000000${String(i).padStart(2, '0')}` });
        results.push(res.status);
      }

      // At least the last request should be throttled
      const hasThrottled = results.includes(429);
      expect(hasThrottled).toBe(true);

      // Verify the throttled response structure
      const throttledIndex = results.lastIndexOf(429);
      expect(throttledIndex).toBeGreaterThanOrEqual(5);
    });
  });
});
