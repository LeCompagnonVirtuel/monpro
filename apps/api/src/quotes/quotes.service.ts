import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteStatus, ServiceRequestStatus } from '@prisma/client';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async create(professionalId: string, data: {
    serviceRequestId: string;
    laborCost: number;
    materialCost?: number;
    transportCost?: number;
    description?: string;
    estimatedDuration?: string;
    validUntil?: Date;
  }) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: data.serviceRequestId },
    });

    if (!request) throw new NotFoundException('Demande non trouvée');
    const acceptableStatuses: ServiceRequestStatus[] = [ServiceRequestStatus.SUBMITTED, ServiceRequestStatus.MATCHING, ServiceRequestStatus.QUOTED];
    if (!acceptableStatuses.includes(request.status)) {
      throw new BadRequestException('Cette demande n\'accepte plus de devis');
    }

    const totalAmount = data.laborCost + (data.materialCost || 0) + (data.transportCost || 0);

    const quote = await this.prisma.quote.create({
      data: {
        serviceRequestId: data.serviceRequestId,
        professionalId,
        laborCost: data.laborCost,
        materialCost: data.materialCost || 0,
        transportCost: data.transportCost || 0,
        totalAmount,
        description: data.description,
        estimatedDuration: data.estimatedDuration,
        validUntil: data.validUntil,
      },
    });

    await this.prisma.serviceRequest.update({
      where: { id: data.serviceRequestId },
      data: { status: ServiceRequestStatus.QUOTED },
    });

    return quote;
  }

  async accept(id: string, clientId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { serviceRequest: true },
    });

    if (!quote) throw new NotFoundException('Devis non trouvé');
    if (quote.serviceRequest.clientId !== clientId) throw new ForbiddenException();

    await this.prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.ACCEPTED },
    });

    await this.prisma.quote.updateMany({
      where: { serviceRequestId: quote.serviceRequestId, id: { not: id } },
      data: { status: QuoteStatus.REJECTED },
    });

    await this.prisma.serviceRequest.update({
      where: { id: quote.serviceRequestId },
      data: { status: ServiceRequestStatus.ACCEPTED },
    });

    return this.prisma.quote.findUnique({ where: { id }, include: { professional: { include: { user: true } } } });
  }

  async reject(id: string, clientId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { serviceRequest: true },
    });

    if (!quote) throw new NotFoundException('Devis non trouvé');
    if (quote.serviceRequest.clientId !== clientId) throw new ForbiddenException();

    return this.prisma.quote.update({ where: { id }, data: { status: QuoteStatus.REJECTED } });
  }

  async findByRequest(serviceRequestId: string) {
    return this.prisma.quote.findMany({
      where: { serviceRequestId },
      include: {
        professional: {
          include: { user: { select: { fullName: true, avatarUrl: true } } },
        },
      },
      orderBy: { totalAmount: 'asc' },
    });
  }

  async findByProfessional(professionalId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.quote.findMany({
        where: { professionalId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { serviceRequest: { include: { service: true, client: { select: { fullName: true } } } } },
      }),
      this.prisma.quote.count({ where: { professionalId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
