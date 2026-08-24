import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceRequestStatus, UrgencyLevel } from '@prisma/client';
import { validateServiceRequestTransition } from '../common/state-machines';

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
          mimeType: 'image/jpeg',
        })),
      });
    }

    return this.findOne(request.id, clientId);
  }

  async findOne(id: string, _userId?: string) {
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
    return request;
  }

  async findByClient(clientId: string, status?: ServiceRequestStatus, page?: number, limit?: number) {
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const skip = (p - 1) * l;
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

  async findForProfessional(professionalId: string, page = 1, limit = 20) {
    const pro = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      include: { services: true },
    });

    if (!pro) throw new NotFoundException('Profil professionnel non trouvé');

    const serviceIds = pro.services.map((s) => s.serviceId);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where: {
          serviceId: { in: serviceIds },
          status: { in: [ServiceRequestStatus.SUBMITTED, ServiceRequestStatus.MATCHING] },
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
          status: { in: [ServiceRequestStatus.SUBMITTED, ServiceRequestStatus.MATCHING] },
        },
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, status: ServiceRequestStatus, userId: string) {
    const request = await this.prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Demande non trouvée');
    if (request.clientId !== userId) throw new ForbiddenException();

    validateServiceRequestTransition(request.status, status);

    return this.prisma.serviceRequest.update({ where: { id }, data: { status } });
  }
}
