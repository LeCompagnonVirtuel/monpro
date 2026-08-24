import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

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
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

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

  async matchForRequest(serviceId: string, latitude?: number, longitude?: number) {
    const professionals = await this.prisma.professional.findMany({
      where: {
        verificationStatus: VerificationStatus.VERIFIED,
        isAvailable: true,
        services: { some: { serviceId } },
        user: { isActive: true },
      },
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

    return professionals.map((pro) => {
      let score = 50;
      score += pro.averageRating * 10;
      score += Math.min(pro.totalInterventions, 50);
      score += pro.responseRate * 20;
      score -= (1 - pro.completionRate) * 30;
      if (pro.verificationStatus === VerificationStatus.VERIFIED) score += 15;
      return { ...pro, matchScore: Math.round(score) };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }
}
