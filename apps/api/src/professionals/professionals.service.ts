import { Injectable, NotFoundException, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, VerificationStatus } from '@prisma/client';
import { paginate } from '../common/utils/pagination';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  constructor(
    private prisma: PrismaService,
    @Optional() private aiService?: AiService,
  ) {}

  async findAll(filters?: {
    serviceId?: string;
    categoryId?: string;
    verified?: boolean;
    available?: boolean;
    search?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
  }) {
    const { page, limit, skip } = paginate(filters?.page, filters?.limit);

    const where: any = {
      user: { isActive: true },
    };

    if (filters?.verified) {
      where.verificationStatus = VerificationStatus.VERIFIED;
    }

    if (filters?.available !== undefined) {
      where.isAvailable = filters.available;
    }

    if (filters?.serviceId) {
      where.services = { some: { serviceId: filters.serviceId } };
    }

    if (filters?.categoryId) {
      where.services = {
        some: { service: { subcategory: { categoryId: filters.categoryId } } },
      };
    }

    if (filters?.search) {
      where.OR = [
        { user: { fullName: { contains: filters.search, mode: 'insensitive' } } },
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.latitude != null && filters?.longitude != null) {
      const radiusKm = filters.radiusKm || 15;
      const nearbyIds = await this.prisma.$queryRaw<{ professionalId: string }[]>(
        Prisma.sql`
          SELECT DISTINCT "professionalId" FROM (
            SELECT "professionalId", "radiusKm",
              6371 * acos(
                LEAST(1.0, cos(radians(${filters.latitude})) * cos(radians(latitude))
                * cos(radians(longitude) - radians(${filters.longitude}))
                + sin(radians(${filters.latitude})) * sin(radians(latitude)))
              ) AS distance_km
            FROM professional_zones
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
          ) sub
          WHERE distance_km <= LEAST(COALESCE("radiusKm", 15), ${radiusKm})
        `,
      );
      where.id = { in: nearbyIds.map((r) => r.professionalId) };
    }

    let orderBy: any = { averageRating: 'desc' };
    if (filters?.sortBy === 'rating') orderBy = { averageRating: 'desc' };
    if (filters?.sortBy === 'reviews') orderBy = { totalReviews: 'desc' };
    if (filters?.sortBy === 'interventions') orderBy = { totalInterventions: 'desc' };

    const [professionals, total] = await Promise.all([
      this.prisma.professional.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true, phone: true } },
          services: { include: { service: true } },
          zones: true,
        },
      }),
      this.prisma.professional.count({ where }),
    ]);

    return { data: professionals, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUserId(userId: string) {
    const pro = await this.prisma.professional.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, phone: true, createdAt: true } },
        services: { include: { service: { include: { subcategory: { include: { category: true } } } } } },
        zones: true,
        availability: true,
        portfolio: true,
      },
    });

    if (!pro) throw new NotFoundException('Profil professionnel non trouvé');
    return pro;
  }

  async findOne(id: string) {
    const pro = await this.prisma.professional.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, phone: true, createdAt: true } },
        services: { include: { service: { include: { subcategory: { include: { category: true } } } } } },
        zones: true,
        availability: true,
        portfolio: true,
        reviews: {
          include: { client: { select: { fullName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!pro) throw new NotFoundException('Professionnel non trouvé');
    return pro;
  }

  async createProfile(userId: string, data: {
    businessName?: string;
    description?: string;
    experienceYears?: number;
    serviceIds?: string[];
    zones?: { name: string; latitude?: number; longitude?: number; radiusKm?: number }[];
  }) {
    const professional = await this.prisma.professional.create({
      data: {
        userId,
        businessName: data.businessName,
        description: data.description,
        experienceYears: data.experienceYears,
      },
    });

    if (data.serviceIds?.length) {
      await this.prisma.professionalService.createMany({
        data: data.serviceIds.map((serviceId) => ({
          professionalId: professional.id,
          serviceId,
        })),
      });
    }

    if (data.zones?.length) {
      await this.prisma.professionalZone.createMany({
        data: data.zones.map((zone) => ({
          professionalId: professional.id,
          ...zone,
        })),
      });
    }

    return this.findOne(professional.id);
  }

  async updateProfile(id: string, data: any) {
    return this.prisma.professional.update({ where: { id }, data });
  }

  async verify(id: string, adminId: string, status: VerificationStatus) {
    return this.prisma.professional.update({
      where: { id },
      data: {
        verificationStatus: status,
        verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
        verifiedBy: adminId,
      },
    });
  }

  async matchForRequest(
    serviceId: string,
    latitude?: number,
    longitude?: number,
    requestContext?: { description?: string; urgency?: string; city?: string },
  ) {
    let geoFilteredIds: string[] | null = null;
    const distances = new Map<string, number>();

    if (latitude != null && longitude != null) {
      const nearbyZones = await this.prisma.$queryRaw<
        { professionalId: string; distance_km: number }[]
      >(Prisma.sql`
        SELECT "professionalId", distance_km FROM (
          SELECT "professionalId", "radiusKm",
            6371 * acos(
              LEAST(1.0, cos(radians(${latitude})) * cos(radians(latitude))
              * cos(radians(longitude) - radians(${longitude}))
              + sin(radians(${latitude})) * sin(radians(latitude)))
            ) AS distance_km
          FROM professional_zones
          WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ) sub
        WHERE distance_km <= COALESCE("radiusKm", 15)
      `);

      geoFilteredIds = [...new Set(nearbyZones.map((z) => z.professionalId))];
      for (const z of nearbyZones) {
        const existing = distances.get(z.professionalId);
        if (existing == null || z.distance_km < existing) {
          distances.set(z.professionalId, z.distance_km);
        }
      }

      if (geoFilteredIds.length === 0) return [];
    }

    const where: any = {
      verificationStatus: VerificationStatus.VERIFIED,
      isAvailable: true,
      services: { some: { serviceId } },
      user: { isActive: true },
    };

    if (geoFilteredIds) {
      where.id = { in: geoFilteredIds };
    }

    const professionals = await this.prisma.professional.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        services: { where: { serviceId }, include: { service: true } },
        zones: true,
      },
      orderBy: [
        { averageRating: 'desc' },
        { totalInterventions: 'desc' },
        { responseRate: 'desc' },
      ],
      take: 20,
    });

    const scored = professionals.map((pro) => {
      let score = 50;
      score += pro.averageRating * 10;
      score += Math.min(pro.totalInterventions, 50);
      score += pro.responseRate * 20;
      score -= (1 - pro.completionRate) * 30;
      if (pro.verificationStatus === VerificationStatus.VERIFIED) score += 15;
      const distanceKm = distances.get(pro.id);
      if (distanceKm != null) {
        score += Math.max(0, 20 - distanceKm);
      }
      return { ...pro, matchScore: Math.round(score), distanceKm: distanceKm ?? null };
    }).sort((a, b) => b.matchScore - a.matchScore);

    if (!requestContext || !this.aiService) {
      return scored;
    }

    try {
      const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
      const aiScores = await this.aiService.scoreProfessionals(
        scored.map((p) => ({
          id: p.id,
          name: p.user.fullName,
          rating: p.averageRating,
          completedJobs: p.totalInterventions,
          responseTime: `${Math.round((1 - p.responseRate) * 24)}h`,
          distanceKm: p.distanceKm,
          specializations: p.services.map((s) => s.service.name),
        })),
        {
          serviceName: service?.name ?? 'Inconnu',
          description: requestContext.description ?? '',
          urgency: requestContext.urgency ?? 'NORMAL',
          city: requestContext.city ?? 'Abidjan',
        },
      );

      if (aiScores.size > 0) {
        return scored.map((p) => ({
          ...p,
          matchScore: aiScores.get(p.id) ?? p.matchScore,
        })).sort((a, b) => b.matchScore - a.matchScore);
      }
    } catch (err) {
      this.logger.warn('AI scoring failed, falling back to static scores', err);
    }

    return scored;
  }
}
