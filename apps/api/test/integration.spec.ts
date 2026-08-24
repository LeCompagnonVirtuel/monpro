import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test123@localhost:5433/monpro_test';

describe('MONPRO Integration Tests (PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB_URL;
    process.env.JWT_SECRET = 'test-secret-for-integration';
    process.env.NODE_ENV = 'test';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('Health', () => {
    it('GET /api/v1/health should return ok', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ok');
    });

    it('GET /api/v1/health/ready should confirm database connection', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.data.database).toBe('connected');
    });
  });

  describe('Auth Flow', () => {
    const phone = `+22507009${Date.now().toString().slice(-4)}`;

    it('POST /api/v1/auth/request-otp should accept valid phone', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({ phone });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message');
    });

    it('POST /api/v1/auth/verify-otp should reject wrong code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phone, code: '000000' });
      expect([400, 401]).toContain(res.status);
    });

    it('POST /api/v1/auth/register should reject invalid data', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ phone: 'invalid', fullName: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('Public Endpoints', () => {
    it('GET /api/v1/categories should return list', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/categories');
      expect(res.status).toBe(200);
    });

    it('GET /api/v1/professionals should return paginated list', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/professionals');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
    });

    it('GET /api/v1/geography/countries should return countries', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/geography/countries');
      expect(res.status).toBe(200);
    });
  });

  describe('Protected Endpoints — No Auth', () => {
    it('GET /api/v1/users/me should return 401 without token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/bookings should return 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send({ quoteId: 'fake' });
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/payments should return 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .send({ bookingId: 'fake', provider: 'ORANGE_MONEY', phoneNumber: '+225' });
      expect(res.status).toBe(401);
    });
  });

  describe('Validation — DTO Rejection', () => {
    it('POST /api/v1/auth/request-otp should reject missing phone', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({});
      expect(res.status).toBe(400);
    });

    it('POST /api/v1/auth/request-otp should reject extra fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({ phone: '+2250700000001', malicious: 'payload' });
      expect(res.status).toBe(400);
    });
  });

  describe('Webhook Idempotency', () => {
    it('POST /api/v1/payments/webhook/:provider should accept webhook', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook/ORANGE_MONEY')
        .set('x-webhook-signature', 'dev-signature')
        .send({ reference: 'UNKNOWN-REF', status: 'success', amount: 10000 });
      expect(res.status).toBe(201);
      expect(res.body.data.received).toBe(true);
    });
  });

  describe('Database Constraints', () => {
    it('should reject negative payment amount via CHECK constraint', async () => {
      await expect(
        prisma.$executeRaw`INSERT INTO payments (id, "bookingId", amount, commission, "professionalAmount", "commissionRate", provider, status) VALUES (gen_random_uuid(), gen_random_uuid(), -100, 0, 0, 0, 'ORANGE_MONEY', 'PENDING')`
      ).rejects.toThrow();
    });

    it('should reject rating > 5 via CHECK constraint', async () => {
      await expect(
        prisma.$executeRaw`INSERT INTO reviews (id, "bookingId", "clientId", "professionalId", "overallRating") VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 6)`
      ).rejects.toThrow();
    });

    it('should reject commission rate > 1 via CHECK constraint', async () => {
      await expect(
        prisma.$executeRaw`INSERT INTO commission_configs (id, rate, "isActive") VALUES (gen_random_uuid(), 1.5, true)`
      ).rejects.toThrow();
    });
  });
});
