import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteStatus, ServiceRequestStatus, NotificationType } from '@prisma/client';
import { validateQuoteTransition } from '../common/state-machines';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(userId: string, data: {
    serviceRequestId: string;
    laborCost: number;
    materialCost?: number;
    transportCost?: number;
    description?: string;
    estimatedDuration?: string;
    validUntil?: Date;
  }) {
    const professional = await this.prisma.professional.findUnique({
      where: { userId },
    });
    if (!professional) throw new NotFoundException('Profil professionnel non trouvé');
    const professionalId = professional.id;

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

    await this.notifications.create(
      request.clientId,
      NotificationType.NEW_QUOTE,
      'Nouveau devis reçu',
      `Un professionnel vous a envoyé un devis de ${totalAmount} XOF`,
      { serviceRequestId: data.serviceRequestId, quoteId: quote.id },
    );

    return quote;
  }

  async accept(id: string, clientId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { serviceRequest: true },
    });

    if (!quote) throw new NotFoundException('Devis non trouvé');
    if (quote.serviceRequest.clientId !== clientId) throw new ForbiddenException();
    validateQuoteTransition(quote.status, QuoteStatus.ACCEPTED);

    await this.prisma.$transaction([
      this.prisma.quote.update({
        where: { id },
        data: { status: QuoteStatus.ACCEPTED },
      }),
      this.prisma.quote.updateMany({
        where: { serviceRequestId: quote.serviceRequestId, id: { not: id }, status: QuoteStatus.PENDING },
        data: { status: QuoteStatus.REJECTED },
      }),
      this.prisma.serviceRequest.update({
        where: { id: quote.serviceRequestId },
        data: { status: ServiceRequestStatus.ACCEPTED },
      }),
    ]);

    const accepted = await this.prisma.quote.findUnique({ where: { id }, include: { professional: true } });
    if (accepted) {
      await this.notifications.create(
        accepted.professional.userId,
        NotificationType.QUOTE_ACCEPTED,
        'Devis accepté',
        'Votre devis a été accepté par le client',
        { serviceRequestId: quote.serviceRequestId, quoteId: id },
      );
    }

    return this.prisma.quote.findUnique({ where: { id }, include: { professional: { include: { user: true } } } });
  }

  async reject(id: string, clientId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { serviceRequest: true },
    });

    if (!quote) throw new NotFoundException('Devis non trouvé');
    if (quote.serviceRequest.clientId !== clientId) throw new ForbiddenException();
    validateQuoteTransition(quote.status, QuoteStatus.REJECTED);

    return this.prisma.quote.update({ where: { id }, data: { status: QuoteStatus.REJECTED } });
  }

  async findByRequest(serviceRequestId: string, userId?: string) {
    if (userId) {
      const request = await this.prisma.serviceRequest.findUnique({ where: { id: serviceRequestId } });
      if (!request) throw new NotFoundException('Demande non trouvée');
      const isOwner = request.clientId === userId;
      if (!isOwner) {
        const professional = await this.prisma.professional.findUnique({ where: { userId } });
        const hasQuoted = professional && await this.prisma.quote.findFirst({
          where: { serviceRequestId, professionalId: professional.id },
        });
        if (!hasQuoted) throw new ForbiddenException('Accès interdit');
      }
    }
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

  async findByProfessional(professionalId: string, page = 1, limit = 20, userId?: string) {
    if (userId) {
      const professional = await this.prisma.professional.findUnique({ where: { id: professionalId } });
      if (!professional || professional.userId !== userId) {
        throw new ForbiddenException('Accès interdit');
      }
    }
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
