import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ServiceRequestStatus, UrgencyLevel } from '@prisma/client';
import { validateServiceRequestTransition } from '../common/state-machines';
import { paginate } from '../common/utils/pagination';

function inferMimeType(url: string): string {
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'heic': return 'image/heic';
    default: return 'image/jpeg';
  }
}

@Injectable()
export class ServiceRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(clientId: string, data: {
    serviceId: string;
    title: string;
    description: string;
    urgency?: UrgencyLevel;
    addressId?: string;
    latitude?: number;
    longitude?: number;
    preferredDate?: Date;
    preferredTimeStart?: string;
    preferredTimeEnd?: string;
    mediaUrls?: string[];
  }) {
    const request = await this.prisma.serviceRequest.create({
      data: {
        clientId,
        serviceId: data.serviceId,
        title: data.title,
        description: data.description,
        urgency: data.urgency || UrgencyLevel.NORMAL,
        status: ServiceRequestStatus.SUBMITTED,
        addressId: data.addressId,
        latitude: data.latitude,
        longitude: data.longitude,
        preferredDate: data.preferredDate,
        preferredTimeStart: data.preferredTimeStart,
        preferredTimeEnd: data.preferredTimeEnd,
      },
    });

    if (data.mediaUrls?.length) {
      await this.prisma.requestMedia.createMany({
        data: data.mediaUrls.map((url) => ({
          serviceRequestId: request.id,
          url,
          mimeType: inferMimeType(url),
        })),
      });
    }

    return this.findOne(request.id, clientId);
  }

  async findOne(id: string, userId?: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        service: { include: { subcategory: { include: { category: true } } } },
        client: { select: { id: true, fullName: true, avatarUrl: true } },
        media: true,
        quotes: {
          include: {
            professional: {
              include: { user: { select: { fullName: true, avatarUrl: true } } },
            },
          },
        },
        address: true,
        booking: true,
      },
    });

    if (!request) throw new NotFoundException('Demande non trouvée');

    if (userId) {
      const isClient = request.clientId === userId;
      if (!isClient) {
        const professional = await this.prisma.professional.findUnique({ where: { userId } });
        if (!professional) throw new ForbiddenException('Accès interdit');
        const hasQuoted = await this.prisma.quote.findFirst({
          where: { serviceRequestId: id, professionalId: professional.id },
        });
        if (!hasQuoted) throw new ForbiddenException('Accès interdit');
      }
    }

    return request;
  }

  async findByClient(clientId: string, status?: ServiceRequestStatus, page?: number, limit?: number) {
    const { page: p, limit: l, skip } = paginate(page, limit);
    const where: any = { clientId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: {
          service: { include: { subcategory: { include: { category: true } } } },
          media: true,
          quotes: true,
        },
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);

    return { data, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  async findForProfessionalByUserId(userId: string, page?: number, limit?: number, status?: ServiceRequestStatus) {
    const pro = await this.prisma.professional.findUnique({
      where: { userId },
      include: { services: true },
    });
    if (!pro) throw new NotFoundException('Profil professionnel non trouvé');
    return this.findForProfessional(pro.id, page, limit, status);
  }

  async findForProfessional(professionalId: string, page = 1, limit = 20, status?: ServiceRequestStatus) {
    const pro = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      include: { services: true },
    });

    if (!pro) throw new NotFoundException('Profil professionnel non trouvé');

    const serviceIds = pro.services.map((s) => s.serviceId);
    const skip = (page - 1) * limit;

    const statusFilter = status
      ? { status }
      : { status: { in: [ServiceRequestStatus.SUBMITTED, ServiceRequestStatus.MATCHING] } };

    const [data, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where: {
          serviceId: { in: serviceIds },
          ...statusFilter,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          service: true,
          client: { select: { fullName: true, avatarUrl: true } },
          media: true,
          address: true,
        },
      }),
      this.prisma.serviceRequest.count({
        where: {
          serviceId: { in: serviceIds },
          ...statusFilter,
        },
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findNearbyForProfessional(
    userId: string,
    latitude: number,
    longitude: number,
    radiusKm = 15,
    page = 1,
    limit = 20,
  ) {
    const pro = await this.prisma.professional.findUnique({
      where: { userId },
      include: { services: true },
    });
    if (!pro) throw new NotFoundException('Profil professionnel non trouvé');

    const serviceIds = pro.services.map((s) => s.serviceId);
    const skip = (page - 1) * limit;

    const nearbyRequestIds = await this.prisma.$queryRaw<{ id: string; distance_km: number }[]>(
      Prisma.sql`
        SELECT id, distance_km FROM (
          SELECT id,
            6371 * acos(
              LEAST(1.0, cos(radians(${latitude})) * cos(radians(latitude))
              * cos(radians(longitude) - radians(${longitude}))
              + sin(radians(${latitude})) * sin(radians(latitude)))
            ) AS distance_km
          FROM service_requests
          WHERE latitude IS NOT NULL AND longitude IS NOT NULL
          AND "serviceId" IN (${Prisma.join(serviceIds)})
          AND status IN ('SUBMITTED', 'MATCHING')
        ) sub
        WHERE distance_km <= ${radiusKm}
        ORDER BY distance_km ASC
      `,
    );

    if (nearbyRequestIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const ids = nearbyRequestIds.map((r) => r.id);
    const distances = new Map(nearbyRequestIds.map((r) => [r.id, r.distance_km]));

    const data = await this.prisma.serviceRequest.findMany({
      where: { id: { in: ids } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        service: { include: { subcategory: { include: { category: true } } } },
        address: { select: { fullAddress: true, district: { select: { name: true } }, neighborhood: { select: { name: true } } } },
        media: true,
      },
    });

    const total = nearbyRequestIds.length;

    const enriched = data.map((req) => ({
      id: req.id,
      serviceId: req.serviceId,
      title: req.title,
      description: req.description,
      urgency: req.urgency,
      status: req.status,
      preferredDate: req.preferredDate,
      latitude: req.latitude,
      longitude: req.longitude,
      createdAt: req.createdAt,
      distanceKm: Math.round(distances.get(req.id)! * 10) / 10,
      serviceName: req.service?.name,
      categoryName: req.service?.subcategory?.category?.name,
      districtName: req.address?.district?.name,
      neighborhoodName: req.address?.neighborhood?.name,
      addressLabel: req.address?.fullAddress,
      media: req.media,
    }));

    return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, status: ServiceRequestStatus, userId: string) {
    const request = await this.prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Demande non trouvée');
    if (request.clientId !== userId) throw new ForbiddenException();

    validateServiceRequestTransition(request.status, status);

    return this.prisma.serviceRequest.update({ where: { id }, data: { status } });
  }
}
