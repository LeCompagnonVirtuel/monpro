import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, PaymentProvider, BookingStatus, NotificationType } from '@prisma/client';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { LedgerService } from '../ledger/ledger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';
import { validatePaymentTransition } from '../common/state-machines';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private providerFactory: PaymentProviderFactory,
    private ledger: LedgerService,
    private notifications: NotificationsService,
    private realtimeService: RealtimeService,
  ) {}

  async initiate(bookingId: string, provider: PaymentProvider, phoneNumber: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { serviceRequest: true },
    });
    if (!booking) throw new NotFoundException('Réservation non trouvée');
    if (booking.serviceRequest.clientId !== userId) {
      throw new ForbiddenException('Vous ne pouvez payer que vos propres réservations');
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Le paiement n\'est possible qu\'après la fin de l\'intervention');
    }

    const commissionRate = await this.resolveCommissionRate(bookingId);
    const commission = Math.round(booking.totalAmount * commissionRate);
    const professionalAmount = booking.totalAmount - commission;

    const payment = await this.prisma.payment.create({
      data: {
        bookingId,
        amount: booking.totalAmount,
        commission,
        professionalAmount,
        commissionRate,
        provider,
        status: PaymentStatus.PROCESSING,
      },
    });

    const paymentProvider = this.providerFactory.getProvider(provider);
    const result = await paymentProvider.initiate({
      amount: booking.totalAmount,
      phoneNumber,
      reference: payment.id,
      description: `Paiement MONPRO - Réservation ${bookingId}`,
    });

    await this.prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        provider,
        providerRef: result.providerRef,
        amount: booking.totalAmount,
        status: PaymentStatus.PROCESSING,
        metadata: result.metadata,
      },
    });

    return { paymentId: payment.id, ...result };
  }

  async handleWebhook(provider: PaymentProvider, payload: any) {
    const paymentProvider = this.providerFactory.getProvider(provider);
    const result = paymentProvider.parseWebhook(payload);

    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { provider_providerRef: { provider, providerRef: result.providerRef } },
      include: { payment: true },
    });

    if (!transaction) return { received: true };

    if (transaction.processedAt) {
      return { received: true, alreadyProcessed: true };
    }

    const status = result.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;

    await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: { status, processedAt: new Date() },
    });

    await this.prisma.payment.update({
      where: { id: transaction.paymentId },
      data: {
        status,
        paidAt: result.success ? new Date() : undefined,
        providerRef: result.providerRef,
      },
    });

    if (result.success) {
      const payment = transaction.payment;
      const existingEntries = await this.prisma.ledgerEntry.count({ where: { paymentId: payment.id } });
      if (existingEntries === 0) {
        const booking = await this.prisma.booking.findUnique({
          where: { id: payment.bookingId },
          include: { serviceRequest: true },
        });
        if (booking) {
          await this.ledger.recordPayment(
            payment.id,
            booking.serviceRequest.clientId,
            booking.professionalId,
            payment.amount,
            payment.commission,
            payment.professionalAmount,
          );
          await this.notifications.create(
            booking.serviceRequest.clientId,
            NotificationType.NEW_PAYMENT,
            'Paiement confirmé',
            `Votre paiement de ${payment.amount} XOF a été confirmé`,
            { bookingId: booking.id },
          );
          const professional = await this.prisma.professional.findUnique({ where: { id: booking.professionalId } });
          if (professional) {
            await this.notifications.create(
              professional.userId,
              NotificationType.NEW_PAYMENT,
              'Paiement reçu',
              `Vous avez reçu ${payment.professionalAmount} XOF`,
              { bookingId: booking.id },
            );
          }

          const eventPayload = {
            type: 'payment.updated' as const,
            entityId: payment.id,
            metadata: { bookingId: booking.id, status },
          };
          this.realtimeService.emitToUser(booking.serviceRequest.clientId, eventPayload);
          if (professional) {
            this.realtimeService.emitToUser(professional.userId, eventPayload);
          }
        }
      }
    }

    return { received: true, status };
  }

  private async resolveCommissionRate(bookingId: string): Promise<number> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceRequest: { include: { service: { include: { subcategory: true } } } },
        professional: true,
      },
    });

    if (!booking) throw new NotFoundException('Réservation non trouvée');

    // Priority: Professional override → Service → Category → Global default
    const professionalConfig = await this.prisma.commissionConfig.findFirst({
      where: { professionalId: booking.professionalId },
    });
    if (professionalConfig) return professionalConfig.rate;

    const serviceConfig = await this.prisma.commissionConfig.findFirst({
      where: { serviceId: booking.serviceRequest.serviceId },
    });
    if (serviceConfig) return serviceConfig.rate;

    const categoryId = booking.serviceRequest.service.subcategory?.categoryId;
    if (categoryId) {
      const categoryConfig = await this.prisma.commissionConfig.findFirst({
        where: { categoryId },
      });
      if (categoryConfig) return categoryConfig.rate;
    }

    const globalConfig = await this.prisma.commissionConfig.findFirst({
      where: { isDefault: true },
    });
    if (globalConfig) return globalConfig.rate;

    throw new BadRequestException('Aucune configuration de commission trouvée. Opération refusée.');
  }

  async findByBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { serviceRequest: true, professional: true },
    });
    if (!booking) throw new NotFoundException('Réservation non trouvée');
    const isClient = booking.serviceRequest.clientId === userId;
    const isProfessional = booking.professional.userId === userId;
    if (!isClient && !isProfessional) {
      throw new ForbiddenException('Accès interdit');
    }
    return this.prisma.payment.findUnique({
      where: { bookingId },
      include: { transactions: true },
    });
  }

  async pollStatus(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: { include: { serviceRequest: true, professional: true } } },
    });
    if (!payment) throw new NotFoundException('Paiement non trouvé');

    const isClient = payment.booking.serviceRequest.clientId === userId;
    if (!isClient) throw new ForbiddenException('Accès interdit');

    if (['COMPLETED', 'FAILED', 'REFUNDED'].includes(payment.status)) {
      return { status: payment.status, alreadyProcessed: true };
    }

    if (!payment.providerRef || !payment.provider) {
      return { status: payment.status };
    }

    const provider = this.providerFactory.getProvider(payment.provider);
    const result = await provider.checkStatus(payment.providerRef);

    const statusMap: Record<string, PaymentStatus> = {
      SUCCESSFUL: PaymentStatus.COMPLETED,
      SUCCESS: PaymentStatus.COMPLETED,
      COMPLETED: PaymentStatus.COMPLETED,
      FAILED: PaymentStatus.FAILED,
      CANCELLED: PaymentStatus.FAILED,
      EXPIRED: PaymentStatus.FAILED,
      REJECTED: PaymentStatus.FAILED,
      TIMEOUT: PaymentStatus.FAILED,
      PENDING: PaymentStatus.PROCESSING,
      PROCESSING: PaymentStatus.PROCESSING,
    };

    const newStatus = statusMap[result.status] || payment.status;
    if (newStatus !== payment.status) {
      await this.handleWebhook(payment.provider, {
        reference: payment.providerRef,
        status: result.status === 'SUCCESSFUL' || result.status === 'SUCCESS' || result.status === 'COMPLETED' ? 'success' : 'failed',
        amount: payment.amount,
      });
    }

    return { status: newStatus };
  }

  async refund(paymentId: string, reason: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: { include: { serviceRequest: true, professional: true } } },
    });
    if (!payment) throw new NotFoundException('Paiement non trouvé');
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Seuls les paiements complétés peuvent être remboursés');
    }

    const isClient = payment.booking.serviceRequest.clientId === userId;
    if (!isClient) throw new ForbiddenException('Seul le client peut demander un remboursement');

    const existingEntries = await this.prisma.ledgerEntry.count({ where: { paymentId: payment.id } });
    if (existingEntries === 0) {
      throw new BadRequestException('Aucune écriture comptable à rembourser');
    }

    await this.ledger.recordRefund(
      payment.id,
      payment.booking.serviceRequest.clientId,
      payment.booking.professional.userId,
      payment.amount,
      payment.commission,
    );

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REFUNDED },
    });

    this.logger.log(`Payment ${paymentId} refunded: ${reason}`);

    const eventPayload = {
      type: 'payment.updated' as const,
      entityId: paymentId,
      metadata: { bookingId: payment.bookingId, status: PaymentStatus.REFUNDED },
    };
    this.realtimeService.emitToUser(payment.booking.serviceRequest.clientId, eventPayload);
    this.realtimeService.emitToUser(payment.booking.professional.userId, eventPayload);

    await this.notifications.create(
      payment.booking.serviceRequest.clientId,
      NotificationType.NEW_PAYMENT,
      'Remboursement effectué',
      `Votre paiement de ${payment.amount} XOF a été remboursé`,
      { bookingId: payment.bookingId },
    );

    return { refunded: true };
  }
}
