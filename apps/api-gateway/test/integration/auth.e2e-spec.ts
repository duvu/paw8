import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../../../libs/common/src/filters/all-exceptions.filter';
import { I18nService } from 'nestjs-i18n';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let refreshToken: string;

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
    const i18nService = app.get<I18nService>(I18nService);
    app.useGlobalFilters(new AllExceptionsFilter(i18nService));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'staff@demo.paw8.dev', password: 'Password@123' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('expiresIn');
      refreshToken = res.body.refreshToken;
    });

    it('should still login when login-attempt migration table is missing', async () => {
      const dataSource = app.get('DataSource');
      await dataSource.query('DROP TABLE IF EXISTS user_login_attempts');

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'staff@demo.paw8.dev', password: 'Password@123' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should return 401 with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'staff@demo.paw8.dev', password: 'WrongPassword' })
        .expect(401);
    });

    it('should return 401 with non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Password@123' })
        .expect(401);
    });

    it('should return 400 with missing email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ password: 'Password@123' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // Get a fresh refresh token
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'staff@demo.paw8.dev', password: 'Password@123' });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
    });

    it('should return 401 with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid_token_abc123' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout and revoke refresh token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'staff@demo.paw8.dev', password: 'Password@123' });

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(200);

      // After logout, refresh token should be invalid
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(401);
    });
  });

  describe('i18n — localized error messages', () => {
    it('should return English error when Accept-Language: en', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Accept-Language', 'en')
        .send({ email: 'staff@demo.paw8.dev', password: 'WrongPassword' })
        .expect(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should return Vietnamese error when Accept-Language: vi', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Accept-Language', 'vi')
        .send({ email: 'staff@demo.paw8.dev', password: 'WrongPassword' })
        .expect(401);
      expect(res.body.error).toBe('Email hoặc mật khẩu không đúng');
    });

    it('should return Chinese error when Accept-Language: zh', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Accept-Language', 'zh')
        .send({ email: 'staff@demo.paw8.dev', password: 'WrongPassword' })
        .expect(401);
      expect(res.body.error).toBe('邮箱或密码错误');
    });

    it('should default to Vietnamese for unsupported locale', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Accept-Language', 'fr')
        .send({ email: 'staff@demo.paw8.dev', password: 'WrongPassword' })
        .expect(401);
      expect(res.body.error).toBe('Email hoặc mật khẩu không đúng');
    });
  });
});
