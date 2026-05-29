import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../../../libs/common/src/filters/all-exceptions.filter';

describe('Tenants (e2e)', () => {
  let app: INestApplication;
  let platformAdminToken: string;
  let staffToken: string;

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

    // Get tokens
    const platformRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'platform@paw8.dev', password: 'Password@123' });
    platformAdminToken = platformRes.body.accessToken;

    const staffRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'staff@demo.paw8.dev', password: 'Password@123' });
    staffToken = staffRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/tenants', () => {
    it('should create tenant as platform_admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({
          name: 'Test Tenant E2E',
          code: 'TEST-E2E-' + Date.now(),
          plan: 'trial',
          maxStores: 2,
          maxUsers: 10,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test Tenant E2E');
    });

    it('should return 403 when staff tries to create tenant', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          name: 'Unauthorized Tenant',
          code: 'UNAUTH-' + Date.now(),
          plan: 'trial',
          maxStores: 1,
          maxUsers: 5,
        })
        .expect(403);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .send({
          name: 'No Auth Tenant',
          code: 'NO-AUTH',
          plan: 'trial',
          maxStores: 1,
          maxUsers: 5,
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/tenants', () => {
    it('should list tenants as platform_admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/tenants')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return 403 when non-platform_admin lists tenants', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tenants')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);
    });
  });
});
