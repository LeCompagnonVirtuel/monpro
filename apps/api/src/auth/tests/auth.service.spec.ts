import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { OtpService } from '../otp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: any;
  let otpService: any;

  const mockPrisma = {
    otpCode: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockOtpService = {
    generate: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OtpService, useValue: mockOtpService },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('mock-jwt') } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    authService = module.get(AuthService);
    prisma = module.get(PrismaService);
    otpService = module.get(OtpService);

    jest.clearAllMocks();
  });

  describe('requestOtp', () => {
    it('should enforce 60s cooldown between OTP requests', async () => {
      mockPrisma.otpCode.count.mockResolvedValue(1);

      await expect(authService.requestOtp({ phone: '+2250700000001' }))
        .rejects.toThrow(BadRequestException);
      await expect(authService.requestOtp({ phone: '+2250700000001' }))
        .rejects.toThrow('Veuillez attendre 60 secondes');
    });

    it('should allow OTP request when cooldown is over', async () => {
      mockPrisma.otpCode.count.mockResolvedValue(0);
      mockOtpService.generate.mockResolvedValue({ code: '123456', hash: '$2b$10$hash' });
      mockPrisma.otpCode.create.mockResolvedValue({});

      const result = await authService.requestOtp({ phone: '+2250700000001' });
      expect(result.message).toBe('OTP envoyé');
      expect(result.expiresIn).toBe(300);
    });

    it('should store the hash NOT the plain code', async () => {
      mockPrisma.otpCode.count.mockResolvedValue(0);
      mockOtpService.generate.mockResolvedValue({ code: '123456', hash: '$2b$10$hashvalue' });
      mockPrisma.otpCode.create.mockResolvedValue({});

      await authService.requestOtp({ phone: '+2250700000001' });

      expect(mockPrisma.otpCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: '$2b$10$hashvalue', // hash, NOT '123456'
        }),
      });
    });
  });

  describe('verifyOtp', () => {
    it('should reject expired OTP', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue(null);

      await expect(authService.verifyOtp({ phone: '+2250700000001', code: '123456' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should reject after max attempts (3)', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue({
        id: '1',
        phone: '+2250700000001',
        code: '$2b$10$hash',
        attempts: 3,
        verified: false,
        expiresAt: new Date(Date.now() + 60000),
      });

      await expect(authService.verifyOtp({ phone: '+2250700000001', code: '123456' }))
        .rejects.toThrow(BadRequestException);
      await expect(authService.verifyOtp({ phone: '+2250700000001', code: '123456' }))
        .rejects.toThrow('Trop de tentatives');
    });

    it('should increment attempts on wrong code', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue({
        id: '1',
        phone: '+2250700000001',
        code: '$2b$10$hash',
        attempts: 0,
        verified: false,
        expiresAt: new Date(Date.now() + 60000),
      });
      mockOtpService.verify.mockResolvedValue(false);

      await expect(authService.verifyOtp({ phone: '+2250700000001', code: '000000' }))
        .rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.otpCode.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { attempts: { increment: 1 } },
      });
    });

    it('should succeed with valid code and return tokens for existing user', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue({
        id: '1',
        phone: '+2250700000001',
        code: '$2b$10$hash',
        attempts: 0,
        verified: false,
        expiresAt: new Date(Date.now() + 60000),
      });
      mockOtpService.verify.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        phone: '+2250700000001',
        fullName: 'Test',
        role: UserRole.CLIENT,
        isActive: true,
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.verifyOtp({ phone: '+2250700000001', code: '123456' });
      expect(result.isNewUser).toBe(false);
      expect((result as any).accessToken).toBeDefined();
    });

    it('should reject suspended user', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue({
        id: '1',
        phone: '+2250700000001',
        code: '$2b$10$hash',
        attempts: 0,
        verified: false,
        expiresAt: new Date(Date.now() + 60000),
      });
      mockOtpService.verify.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        phone: '+2250700000001',
        isActive: false,
      });

      await expect(authService.verifyOtp({ phone: '+2250700000001', code: '123456' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should require verified OTP within 10 minutes', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue(null);

      await expect(authService.register({
        phone: '+2250700000001',
        fullName: 'Test User',
      })).rejects.toThrow(BadRequestException);
    });

    it('should BLOCK ADMIN role self-assignment', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue({ id: '1', verified: true });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: 'new-user', ...data });
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      await authService.register({
        phone: '+2250700000001',
        fullName: 'Hacker',
        role: UserRole.ADMIN,
      });

      // Verify ADMIN was NOT used
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: UserRole.CLIENT, // Fallback to CLIENT, not ADMIN
        }),
      });
    });

    it('should allow CLIENT role', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue({ id: '1', verified: true });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: 'new-user', ...data });
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      await authService.register({
        phone: '+2250700000001',
        fullName: 'Client User',
        role: UserRole.CLIENT,
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: UserRole.CLIENT }),
      });
    });

    it('should allow PROFESSIONAL role', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue({ id: '1', verified: true });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: 'new-user', ...data });
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      await authService.register({
        phone: '+2250700000001',
        fullName: 'Pro User',
        role: UserRole.PROFESSIONAL,
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: UserRole.PROFESSIONAL }),
      });
    });

    it('should reject already registered phone', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue({ id: '1', verified: true });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', phone: '+2250700000001' });

      await expect(authService.register({
        phone: '+2250700000001',
        fullName: 'Duplicate',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('registerEmail', () => {
    it('should create a new user with email and hashed password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: 'new-user', ...data });
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.registerEmail({
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.fullName).toBe('Test User');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'test@example.com' });

      await expect(authService.registerEmail({
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User',
      })).rejects.toThrow(BadRequestException);
    });

    it('should hash the password with bcrypt', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: 'new-user', ...data });
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      await authService.registerEmail({
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User',
      });

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      const passwordHash = createCall.data.passwordHash;
      expect(passwordHash).not.toBe('Password123!');
      expect(passwordHash.startsWith('$2b$')).toBe(true);
    });

    it('should default to CLIENT role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: 'new-user', ...data });
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      await authService.registerEmail({
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User',
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: UserRole.CLIENT }),
      });
    });

    it('should allow PROFESSIONAL role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(({ data }) => {
        return Promise.resolve({ id: 'new-user', ...data });
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      await authService.registerEmail({
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Pro User',
        role: UserRole.PROFESSIONAL,
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: UserRole.PROFESSIONAL }),
      });
    });
  });

  describe('loginEmail', () => {
    it('should login with valid email and password', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
        fullName: 'Test User',
        role: UserRole.CLIENT,
        isActive: true,
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.loginEmail({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.loginEmail({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      })).rejects.toThrow(UnauthorizedException);
    });

    it('should reject wrong password', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
        fullName: 'Test User',
        role: UserRole.CLIENT,
        isActive: true,
      });

      await expect(authService.loginEmail({
        email: 'test@example.com',
        password: 'WrongPassword!',
      })).rejects.toThrow(UnauthorizedException);
    });

    it('should reject suspended user', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
        fullName: 'Test User',
        role: UserRole.CLIENT,
        isActive: false,
      });

      await expect(authService.loginEmail({
        email: 'test@example.com',
        password: 'Password123!',
      })).rejects.toThrow(UnauthorizedException);
    });

    it('should reject user without password (phone-only account)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: null,
        fullName: 'Test User',
        role: UserRole.CLIENT,
        isActive: true,
      });

      await expect(authService.loginEmail({
        email: 'test@example.com',
        password: 'Password123!',
      })).rejects.toThrow(BadRequestException);
    });
  });
});
