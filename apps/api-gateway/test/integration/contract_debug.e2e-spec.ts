import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Contract Debug', () => {
  let app: INestApplication;
  let token: string;
  let customerId: string;
  let assetId: string;

  beforeAll(async () => {
    const m = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = m.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    const res = await (request(app.getHttpServer()) as any).post('/api/v1/auth/login').send({ email: 'staff@demo.paw8.dev', password: 'Password@123' });
    token = res.body.accessToken;
  });

  afterAll(() => app.close());

  it('create customer', async () => {
    const ts = Date.now();
    const r = await (request(app.getHttpServer()) as any).post('/api/v1/customers').set('Authorization', `Bearer ${token}`)
      .send({ fullName: `Debug ${ts}`, phone: `09${String(ts).slice(-8)}`, identityNumber: `${String(ts).slice(-12)}`, dateOfBirth: '1990-01-01', permanentAddress: '123 St' });
    console.log('Customer:', r.status, r.body.id);
    customerId = r.body.id;
  });

  it('create asset', async () => {
    const r = await (request(app.getHttpServer()) as any).post('/api/v1/assets').set('Authorization', `Bearer ${token}`)
      .send({ assetType: 'phone', assetName: 'Debug Phone', brand: 'Samsung', model: 'S22', conditionDescription: 'Good', valuationAmount: 8000000, proposedLoanAmount: 5000000 });
    console.log('Asset:', r.status, r.body.id);
    assetId = r.body.id;
  });

  it('create contract', async () => {
    console.log('Using customerId:', customerId, 'assetId:', assetId);
    const r = await (request(app.getHttpServer()) as any).post('/api/v1/contracts').set('Authorization', `Bearer ${token}`)
      .send({ storeId: 'fa606d7d-e47a-48be-9311-604730653188', customerId, assetIds: [assetId], principalAmount: 5000000, interestRate: 3, interestType: 'monthly', startDate: '2026-06-06', dueDate: '2026-07-06' });
    console.log('Contract:', r.status, JSON.stringify(r.body).slice(0, 500));
  });
});
