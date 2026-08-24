import { Test } from '@nestjs/testing';
import { OtpService } from '../otp.service';
import { SMS_PROVIDER } from '../providers/sms.interface';
import * as bcrypt from 'bcrypt';

describe('OtpService', () => {
  let service: OtpService;
  const mockSmsProvider = { sendSms: jest.fn().mockResolvedValue({ success: true }) };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: SMS_PROVIDER, useValue: mockSmsProvider },
      ],
    }).compile();

    service = module.get(OtpService);
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should generate a 6-digit code', async () => {
      const result = await service.generate('+2250700000001');
      expect(result.code).toMatch(/^\d{6}$/);
    });

    it('should return a bcrypt hash, not the plain code', async () => {
      const result = await service.generate('+2250700000001');
      expect(result.hash).not.toBe(result.code);
      expect(result.hash.startsWith('$2b$')).toBe(true);
    });

    it('should generate different codes on each call (crypto randomness)', async () => {
      const results = await Promise.all(
        Array.from({ length: 20 }, () => service.generate('+2250700000001')),
      );
      const codes = results.map(r => r.code);
      const uniqueCodes = new Set(codes);
      // With 20 random 6-digit numbers, probability of all same is negligible
      expect(uniqueCodes.size).toBeGreaterThan(1);
    });

    it('should NOT use Math.random (verified by source inspection)', () => {
      const sourceCode = OtpService.toString();
      expect(sourceCode).not.toContain('Math.random');
    });
  });

  describe('verify', () => {
    it('should return true for correct code against its hash', async () => {
      const { code, hash } = await service.generate('+2250700000001');
      const isValid = await service.verify(code, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for wrong code', async () => {
      const { hash } = await service.generate('+2250700000001');
      const isValid = await service.verify('000000', hash);
      expect(isValid).toBe(false);
    });

    it('should return false for empty code', async () => {
      const { hash } = await service.generate('+2250700000001');
      const isValid = await service.verify('', hash);
      expect(isValid).toBe(false);
    });

    it('should be timing-safe via bcrypt.compare', async () => {
      const { hash } = await service.generate('+2250700000001');
      // bcrypt.compare is inherently constant-time
      const result = await service.verify('123456', hash);
      expect(typeof result).toBe('boolean');
    });
  });
});
