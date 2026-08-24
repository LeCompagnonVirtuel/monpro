import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, PaymentProvider, BookingStatus } from '@prisma/client';
import { PaymentProviderFactory } from './providers/payment-provider.factory';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private providerFactory: PaymentProviderFactory,
  ) {}

  async initiate(bookingId: string, provider: PaymentProvider, phoneNumber: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Réservation non trouvée');
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Le paiement n\'est possible qu\'après la fin de l\'intervention');
    }

    const commissionConfig = await this.prisma.commissionConfig.findFirst({
      where: { isDefault: true },
    });
    const commissionRate = commissionConfig?.rate || 0.10;
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

    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: { providerRef: result.providerRef },
      include: { payment: true },
    });

    if (!transaction) return { received: true };

    const status = result.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;

    await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: { status },
    });

    await this.prisma.payment.update({
      where: { id: transaction.paymentId },
      data: {
        status,
        paidAt: result.success ? new Date() : undefined,
        providerRef: result.providerRef,
      },
    });

    return { received: true, status };
  }

  async findByBooking(bookingId: string) {
    return this.prisma.payment.findUnique({
      where: { bookingId },
      include: { transactions: true },
    });
  }
}
