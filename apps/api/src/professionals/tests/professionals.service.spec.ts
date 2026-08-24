import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProfessionalsService } from '../professionals.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';

describe('ProfessionalsService — Geo-filtering', () => {
  let service: ProfessionalsService;
  let prisma: any;

  const mockPrisma = {
    professional: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    professionalService: { createMany: jest.fn() },
    professionalZone: { createMany: jest.fn() },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProfessionalsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ProfessionalsService);
    jest.clearAllMocks();
  });

  describe('matchForRequest — geo-filtering', () => {
    it('should filter professionals by proximity when coordinates are provided', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { professionalId: 'pro-1', distance_km: 3.2 },
        { professionalId: 'pro-2', distance_km: 8.5 },
      ]);
      mockPrisma.professional.findMany.mockResolvedValue([
        {
          id: 'pro-1',
          averageRating: 4.5,
          totalInterventions: 20,
          responseRate: 0.9,
          completionRate: 0.95,
          verificationStatus: VerificationStatus.VERIFIED,
          zones: [],
          services: [],
          user: { id: 'u1', fullName: 'Pro 1', avatarUrl: null },
        },
        {
          id: 'pro-2',
          averageRating: 4.0,
          totalInterventions: 10,
          responseRate: 0.8,
          completionRate: 0.9,
          verificationStatus: VerificationStatus.VERIFIED,
          zones: [],
          services: [],
          user: { id: 'u2', fullName: 'Pro 2', avatarUrl: null },
        },
      ]);

      const results = await service.matchForRequest('service-1', 5.3364, -4.0267);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockPrisma.professional.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['pro-1', 'pro-2'] },
          }),
        }),
      );
      expect(results).toHaveLength(2);
      expect(results[0].distanceKm).toBeDefined();
      expect(results[0].matchScore).toBeGreaterThan(0);
    });

    it('should return empty array when no professionals are nearby', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const results = await service.matchForRequest('service-1', 5.3364, -4.0267);

      expect(results).toEqual([]);
      expect(mockPrisma.professional.findMany).not.toHaveBeenCalled();
    });

    it('should NOT geo-filter when coordinates are not provided', async () => {
      mockPrisma.professional.findMany.mockResolvedValue([]);

      await service.matchForRequest('service-1');

      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
      expect(mockPrisma.professional.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ id: expect.anything() }),
        }),
      );
    });

    it('should give higher score to closer professionals', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { professionalId: 'pro-close', distance_km: 2.0 },
        { professionalId: 'pro-far', distance_km: 14.0 },
      ]);
      mockPrisma.professional.findMany.mockResolvedValue([
        {
          id: 'pro-close',
          averageRating: 4.0,
          totalInterventions: 10,
          responseRate: 0.8,
          completionRate: 0.9,
          verificationStatus: VerificationStatus.VERIFIED,
          zones: [],
          services: [],
          user: { id: 'u1', fullName: 'Close', avatarUrl: null },
        },
        {
          id: 'pro-far',
          averageRating: 4.0,
          totalInterventions: 10,
          responseRate: 0.8,
          completionRate: 0.9,
          verificationStatus: VerificationStatus.VERIFIED,
          zones: [],
          services: [],
          user: { id: 'u2', fullName: 'Far', avatarUrl: null },
        },
      ]);

      const results = await service.matchForRequest('service-1', 5.3364, -4.0267);

      const closeResult = results.find((r) => r.distanceKm === 2.0);
      const farResult = results.find((r) => r.distanceKm === 14.0);
      expect(closeResult!.matchScore).toBeGreaterThan(farResult!.matchScore);
    });
  });

  describe('findAll — geo-filtering', () => {
    it('should apply geo-filter when latitude/longitude provided', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { professionalId: 'pro-1' },
      ]);
      mockPrisma.professional.findMany.mockResolvedValue([]);
      mockPrisma.professional.count.mockResolvedValue(0);

      await service.findAll({ latitude: 5.3364, longitude: -4.0267, radiusKm: 10 });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockPrisma.professional.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['pro-1'] },
          }),
        }),
      );
    });

    it('should NOT apply geo-filter when no coordinates', async () => {
      mockPrisma.professional.findMany.mockResolvedValue([]);
      mockPrisma.professional.count.mockResolvedValue(0);

      await service.findAll({ search: 'plombier' });

      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });
  });
});
