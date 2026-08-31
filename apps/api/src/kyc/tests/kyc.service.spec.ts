import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { KycService } from '../kyc.service';
import { PrismaService } from '../../prisma/prisma.service';
import { KycStatus, VerificationStatus } from '@prisma/client';

describe('KycService', () => {
  let kycService: KycService;
  let prisma: any;

  const mockPrisma = {
    kycDocument: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    professional: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        KycService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    kycService = module.get(KycService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('submit', () => {
    const dto = {
      documentType: 'CNI' as const,
      documentNumber: 'CI123456',
      frontUrl: 'https://storage.example.com/front.jpg',
      selfieUrl: 'https://storage.example.com/selfie.jpg',
    };

    it('should create a new KYC document with status PENDING', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'pro-1',
        verificationStatus: null,
      });
      mockPrisma.kycDocument.findFirst.mockResolvedValue(null);
      mockPrisma.kycDocument.create.mockResolvedValue({
        id: 'kyc-1',
        professionalId: 'pro-1',
        status: KycStatus.PENDING,
        ...dto,
      });

      const result = await kycService.submit('pro-1', dto);

      expect(result.status).toBe(KycStatus.PENDING);
      expect(mockPrisma.kycDocument.create).toHaveBeenCalledWith({
        data: {
          professionalId: 'pro-1',
          documentType: dto.documentType,
          documentNumber: dto.documentNumber,
          frontUrl: dto.frontUrl,
          backUrl: undefined,
          selfieUrl: dto.selfieUrl,
          status: KycStatus.PENDING,
        },
      });
    });

    it('should set submittedAt to current date on update', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'pro-1',
        verificationStatus: VerificationStatus.PENDING,
      });
      mockPrisma.kycDocument.findFirst.mockResolvedValue({
        id: 'kyc-existing',
        status: KycStatus.PENDING,
      });
      mockPrisma.kycDocument.update.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'kyc-existing', ...data }),
      );

      const before = Date.now();
      await kycService.submit('pro-1', dto);
      const after = Date.now();

      const updateCall = mockPrisma.kycDocument.update.mock.calls[0][0];
      const submittedAt = updateCall.data.submittedAt.getTime();
      expect(submittedAt).toBeGreaterThanOrEqual(before);
      expect(submittedAt).toBeLessThanOrEqual(after);
    });

    it('should update professional verificationStatus to PENDING if it was REJECTED', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'pro-1',
        verificationStatus: VerificationStatus.REJECTED,
      });
      mockPrisma.kycDocument.findFirst.mockResolvedValue(null);
      mockPrisma.professional.update.mockResolvedValue({});
      mockPrisma.kycDocument.create.mockResolvedValue({ id: 'kyc-1' });

      await kycService.submit('pro-1', dto);

      expect(mockPrisma.professional.update).toHaveBeenCalledWith({
        where: { id: 'pro-1' },
        data: { verificationStatus: VerificationStatus.PENDING },
      });
    });

    it('should update existing PENDING document instead of creating duplicate', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'pro-1',
        verificationStatus: VerificationStatus.PENDING,
      });
      mockPrisma.kycDocument.findFirst.mockResolvedValue({
        id: 'kyc-existing',
        status: KycStatus.PENDING,
      });
      mockPrisma.kycDocument.update.mockResolvedValue({
        id: 'kyc-existing',
        status: KycStatus.PENDING,
        ...dto,
      });

      const result = await kycService.submit('pro-1', dto);

      expect(mockPrisma.kycDocument.update).toHaveBeenCalledWith({
        where: { id: 'kyc-existing' },
        data: expect.objectContaining({
          documentType: dto.documentType,
          documentNumber: dto.documentNumber,
        }),
      });
      expect(mockPrisma.kycDocument.create).not.toHaveBeenCalled();
    });

    it('should block submission if professional already has APPROVED KYC', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue({
        id: 'pro-1',
        verificationStatus: VerificationStatus.VERIFIED,
      });
      mockPrisma.kycDocument.findFirst.mockResolvedValue({
        id: 'kyc-approved',
        status: KycStatus.APPROVED,
      });

      await expect(kycService.submit('pro-1', dto)).rejects.toThrow(
        'Un document KYC approuvé existe déjà',
      );
    });

    it('should throw if professional not found', async () => {
      mockPrisma.professional.findUnique.mockResolvedValue(null);

      await expect(kycService.submit('nonexistent', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMyKyc', () => {
    it('should return the latest KYC document for the professional', async () => {
      const mockKyc = {
        id: 'kyc-1',
        professionalId: 'pro-1',
        status: KycStatus.PENDING,
        submittedAt: new Date(),
      };
      mockPrisma.kycDocument.findFirst.mockResolvedValue(mockKyc);

      const result = await kycService.getMyKyc('pro-1');

      expect(result).toEqual(mockKyc);
      expect(mockPrisma.kycDocument.findFirst).toHaveBeenCalledWith({
        where: { professionalId: 'pro-1' },
        orderBy: { submittedAt: 'desc' },
      });
    });

    it('should throw NotFoundException if no KYC exists', async () => {
      mockPrisma.kycDocument.findFirst.mockResolvedValue(null);

      await expect(kycService.getMyKyc('pro-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllPending', () => {
    it('should return all PENDING KYC documents', async () => {
      const mockDocs = [
        { id: 'kyc-1', status: KycStatus.PENDING, professional: { user: {} } },
        { id: 'kyc-2', status: KycStatus.PENDING, professional: { user: {} } },
      ];
      mockPrisma.kycDocument.findMany.mockResolvedValue(mockDocs);

      const result = await kycService.getAllPending();

      expect(result).toHaveLength(2);
      expect(mockPrisma.kycDocument.findMany).toHaveBeenCalledWith({
        where: { status: KycStatus.PENDING },
        orderBy: { submittedAt: 'asc' },
        include: {
          professional: {
            include: {
              user: { select: { id: true, fullName: true, email: true, phone: true } },
            },
          },
        },
      });
    });

    it('should include professional and user data', async () => {
      const mockDocs = [
        {
          id: 'kyc-1',
          status: KycStatus.PENDING,
          professional: {
            id: 'pro-1',
            user: { id: 'user-1', fullName: 'Aya', email: 'aya@test.com', phone: '+2250700000000' },
          },
        },
      ];
      mockPrisma.kycDocument.findMany.mockResolvedValue(mockDocs);

      const result = await kycService.getAllPending();

      expect(result[0].professional.user.fullName).toBe('Aya');
    });
  });
});
