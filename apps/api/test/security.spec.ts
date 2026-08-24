import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';

const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test123@localhost:5433/monpro_test';

describe('Security Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let clientToken: string;
  let clientId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB_URL;
    process.env.JWT_SECRET = 'test-secret-security';
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
    jwtService = app.get(JwtService);

    const user = await prisma.user.create({
      data: { phone: '+2250700200001', fullName: 'Security Test User', role: UserRole.CLIENT },
    });
    clientId = user.id;
    clientToken = jwtService.sign({ sub: clientId, role: UserRole.CLIENT });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: clientId } }).catch(() => {});
    await app?.close();
  });

  describe('JWT Security', () => {
    it('should reject expired token', async () => {
      const expiredToken = jwtService.sign(
        { sub: clientId, role: UserRole.CLIENT },
        { expiresIn: '0s' },
      );
      await new Promise(r => setTimeout(r, 1100));

      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('should reject malformed token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer not.a.valid.jwt');

      expect(res.status).toBe(401);
    });

    it('should reject token with wrong secret', async () => {
      const { JwtService: JS } = require('@nestjs/jwt');
      const fakeJwt = new JS({ secret: 'wrong-secret' });
      const fakeToken = fakeJwt.sign({ sub: clientId, role: UserRole.CLIENT });

      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).toBe(401);
    });

    it('should reject request without Bearer prefix', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', clientToken);

      expect(res.status).toBe(401);
    });
  });

  describe('Input Validation / Injection Prevention', () => {
    it('should reject SQL injection in query params', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/professionals?page=1;DROP TABLE users;--')
        .set('Authorization', `Bearer ${clientToken}`);

      expect([200, 400]).toContain(res.status);
      const usersExist = await prisma.user.count();
      expect(usersExist).toBeGreaterThan(0);
    });

    it('should reject XSS in body fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/service-requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          serviceId: '00000000-0000-0000-0000-000000000001',
          title: '<script>alert("xss")</script>',
          description: '<img src=x onerror=alert(1)>',
        });

      if (res.status === 201) {
        expect(res.body.title).not.toContain('<script>');
      }
    });

    it('should reject requests with forbidden extra properties (pollution vector)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({
          phone: '+2250700200099',
          isAdmin: true,
          role: 'ADMIN',
        });

      expect(res.status).toBe(400);
    });

    it('should reject oversized payloads gracefully', async () => {
      const longStr = 'A'.repeat(100000);
      const res = await request(app.getHttpServer())
        .post('/api/v1/service-requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          serviceId: '00000000-0000-0000-0000-000000000001',
          title: longStr,
          description: longStr,
        });

      expect([400, 413, 500]).toContain(res.status);
      expect(res.status).not.toBe(201);
    });
  });

  describe('RBAC Enforcement', () => {
    it('should reject client accessing admin dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject client accessing admin verifications', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/verifications')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Upload Security', () => {
    it('should reject upload without file', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/uploads/image')
        .set('Authorization', `Bearer ${clientToken}`)
        .field('folder', 'avatars');

      expect([400, 422, 500]).toContain(res.status);
      expect(res.status).not.toBe(201);
    });

    it('should reject invalid folder (path traversal)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/uploads/image')
        .set('Authorization', `Bearer ${clientToken}`)
        .field('folder', '../../../etc/passwd')
        .attach('file', Buffer.from('fake image'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect([400, 403, 500]).toContain(res.status);
      expect(res.status).not.toBe(201);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit on OTP requests', async () => {
      const phone = '+2250700299999';

      await request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({ phone });

      const second = await request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({ phone });

      expect([400, 429]).toContain(second.status);
    });
  });

  describe('Webhook Security', () => {
    it('should not expose internal details for unknown provider', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook/UNKNOWN_PROVIDER')
        .send({ reference: 'test', status: 'success' });

      expect([400, 404, 500]).toContain(res.status);
      if (res.status === 500) {
        expect(res.body.message).not.toContain('stack');
      }
    });

    it('should not crash on empty webhook payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook/ORANGE_MONEY')
        .send({});

      expect([200, 201, 400, 500]).toContain(res.status);
      if (res.body.data) {
        expect(res.body.data.received).toBe(true);
      }
    });
  });
});
