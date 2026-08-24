import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
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
});
