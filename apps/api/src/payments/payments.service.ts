import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, PaymentProvider, BookingStatus, NotificationType } from '@prisma/client';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { LedgerService } from '../ledger/ledger.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private providerFactory: PaymentProviderFactory,
    private ledger: LedgerService,
    private notifications: NotificationsService,
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
}
