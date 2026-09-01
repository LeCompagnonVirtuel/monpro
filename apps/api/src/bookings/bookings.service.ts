import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, ServiceRequestStatus, QuoteStatus, NotificationType, PaymentStatus } from '@prisma/client';
import { validateBookingTransition } from '../common/state-machines';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';
import { paginate } from '../common/utils/pagination';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private realtimeService: RealtimeService,
    private ledger: LedgerService,
  ) {}

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

    const [booking] = await this.prisma.$transaction([
      this.prisma.booking.create({
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
      }),
      this.prisma.serviceRequest.update({
        where: { id: quote.serviceRequestId },
        data: { status: ServiceRequestStatus.SCHEDULED },
      }),
    ]);

    const professional = await this.prisma.professional.findUnique({ where: { id: quote.professionalId } });
    if (professional) {
      await this.notifications.create(
        professional.userId,
        NotificationType.BOOKING_CONFIRMED,
        'Nouvelle réservation',
        `Une réservation de ${quote.totalAmount} XOF a été créée`,
        { bookingId: booking.id },
      );

      this.realtimeService.emitToUser(professional.userId, {
        type: 'booking.created',
        entityId: booking.id,
      });
    }

    return this.findOne(booking.id);
  }

  async findOne(id: string, userId?: string) {
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
    if (userId) {
      const isClient = booking.serviceRequest.clientId === userId;
      const isProfessional = booking.professional.userId === userId;
      if (!isClient && !isProfessional) {
        throw new ForbiddenException('Accès interdit à cette réservation');
      }
    }
    return booking;
  }

  async findByProfessional(professionalId: string, status?: BookingStatus, page?: number, limit?: number, userId?: string) {
    if (userId) {
      const professional = await this.prisma.professional.findUnique({ where: { id: professionalId } });
      if (!professional || professional.userId !== userId) {
        throw new ForbiddenException('Accès interdit');
      }
    }
    const { page: p, limit: l, skip } = paginate(page, limit);
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

    return { data, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  async updateStatus(id: string, status: BookingStatus, userId: string, cancellationReason?: string) {
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

    if (status === BookingStatus.CANCELLED) {
      if (booking.status === BookingStatus.IN_PROGRESS || booking.status === BookingStatus.ARRIVING) {
        throw new BadRequestException('Impossible d\'annuler une intervention en cours. Contactez le support.');
      }
    }

    const update: any = { status };
    if (status === BookingStatus.IN_PROGRESS) update.startedAt = new Date();
    if (status === BookingStatus.COMPLETED) update.completedAt = new Date();
    if (status === BookingStatus.CANCELLED) {
      update.cancelledAt = new Date();
      update.cancellationReason = cancellationReason || 'Annulé par le client';
    }

    const eventPayload = {
      type: 'booking.status_changed' as const,
      entityId: id,
      metadata: { status, cancellationReason: update.cancellationReason },
    };

    if (status === BookingStatus.CANCELLED) {
      const payment = await this.prisma.payment.findUnique({ where: { bookingId: id } });
      if (payment && payment.status === PaymentStatus.COMPLETED) {
        this.logger.log(`Booking ${id} cancelled — initiating refund for payment ${payment.id}`);
        await this.ledger.recordRefund(
          payment.id,
          booking.serviceRequest.clientId,
          booking.professional.userId,
          payment.amount,
          payment.commission,
        );
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.REFUNDED },
        });
      }
    }

    if (status === BookingStatus.COMPLETED) {
      const [result] = await this.prisma.$transaction([
        this.prisma.booking.update({ where: { id }, data: update }),
        this.prisma.serviceRequest.update({
          where: { id: booking.serviceRequestId },
          data: { status: ServiceRequestStatus.COMPLETED },
        }),
      ]);

      this.realtimeService.emitToUser(booking.serviceRequest.clientId, eventPayload);
      this.realtimeService.emitToUser(booking.professional.userId, eventPayload);

      return result;
    }

    const result = await this.prisma.booking.update({ where: { id }, data: update });

    this.realtimeService.emitToUser(booking.serviceRequest.clientId, eventPayload);
    this.realtimeService.emitToUser(booking.professional.userId, eventPayload);

    return result;
  }
}
