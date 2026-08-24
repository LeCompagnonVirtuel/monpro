import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, ServiceRequestStatus, QuoteStatus } from '@prisma/client';
import { validateBookingTransition } from '../common/state-machines';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async createFromQuote(quoteId: string, data: { scheduledDate: Date; scheduledTime?: string; addressId?: string }, userId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { serviceRequest: true },
    });

    if (!quote) throw new NotFoundException('Devis non trouvé');
    if (quote.serviceRequest.clientId !== userId) {
      throw new ForbiddenException('Vous ne pouvez créer une réservation que pour vos propres demandes');
    }
    if (quote.status !== QuoteStatus.ACCEPTED) throw new BadRequestException('Ce devis n\'a pas été accepté');

    const existing = await this.prisma.booking.findUnique({
      where: { serviceRequestId: quote.serviceRequestId },
    });
    if (existing) throw new BadRequestException('Une réservation existe déjà pour cette demande');

    const booking = await this.prisma.booking.create({
      data: {
        serviceRequestId: quote.serviceRequestId,
        quoteId: quote.id,
        professionalId: quote.professionalId,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        addressId: data.addressId || quote.serviceRequest.addressId,
        totalAmount: quote.totalAmount,
        status: BookingStatus.CONFIRMED,
      },
    });

    await this.prisma.serviceRequest.update({
      where: { id: quote.serviceRequestId },
      data: { status: ServiceRequestStatus.SCHEDULED },
    });

    return this.findOne(booking.id);
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        serviceRequest: { include: { service: true, client: { select: { id: true, fullName: true, avatarUrl: true, phone: true } } } },
        quote: true,
        professional: { include: { user: { select: { id: true, fullName: true, avatarUrl: true, phone: true } } } },
        address: true,
        payment: true,
        review: true,
      },
    });
    if (!booking) throw new NotFoundException('Réservation non trouvée');
    return booking;
  }

  async findByProfessional(professionalId: string, status?: BookingStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { professionalId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledDate: 'desc' },
        include: {
          serviceRequest: { include: { service: true, client: { select: { fullName: true, avatarUrl: true } } } },
          address: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, status: BookingStatus, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { serviceRequest: true, professional: true },
    });
    if (!booking) throw new NotFoundException('Réservation non trouvée');

    const isClient = booking.serviceRequest.clientId === userId;
    const isProfessional = booking.professional.userId === userId;
    if (!isClient && !isProfessional) {
      throw new ForbiddenException('Accès interdit à cette réservation');
    }

    validateBookingTransition(booking.status, status);

    if (status === BookingStatus.CANCELLED && !isClient) {
      throw new ForbiddenException('Seul le client peut annuler une réservation');
    }
    if (status === BookingStatus.IN_PROGRESS && !isProfessional) {
      throw new ForbiddenException('Seul le professionnel peut démarrer l\'intervention');
    }
    if (status === BookingStatus.COMPLETED && !isProfessional) {
      throw new ForbiddenException('Seul le professionnel peut terminer l\'intervention');
    }

    const update: any = { status };
    if (status === BookingStatus.IN_PROGRESS) update.startedAt = new Date();
    if (status === BookingStatus.COMPLETED) {
      update.completedAt = new Date();
      await this.prisma.serviceRequest.update({
        where: { id: booking.serviceRequestId },
        data: { status: ServiceRequestStatus.COMPLETED },
      });
    }
    if (status === BookingStatus.CANCELLED) update.cancelledAt = new Date();

    return this.prisma.booking.update({ where: { id }, data: update });
  }
}
