import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerEntryType, LedgerDirection } from '@prisma/client';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async recordPayment(paymentId: string, clientId: string, professionalId: string, amount: number, commission: number, professionalAmount: number) {
    return this.prisma.$transaction([
      this.prisma.ledgerEntry.create({
        data: {
          paymentId,
          accountId: clientId,
          type: LedgerEntryType.PAYMENT_RECEIVED,
          direction: LedgerDirection.DEBIT,
          amount,
        },
      }),
      this.prisma.ledgerEntry.create({
        data: {
          paymentId,
          accountId: 'PLATFORM',
          type: LedgerEntryType.PLATFORM_FEE,
          direction: LedgerDirection.CREDIT,
          amount: commission,
        },
      }),
      this.prisma.ledgerEntry.create({
        data: {
          paymentId,
          accountId: professionalId,
          type: LedgerEntryType.PROFESSIONAL_EARNING,
          direction: LedgerDirection.CREDIT,
          amount: professionalAmount,
        },
      }),
    ]);
  }

  async recordRefund(paymentId: string, clientId: string, professionalId: string, amount: number, commission: number) {
    return this.prisma.$transaction([
      this.prisma.ledgerEntry.create({
        data: {
          paymentId,
          accountId: clientId,
          type: LedgerEntryType.REFUND,
          direction: LedgerDirection.CREDIT,
          amount,
        },
      }),
      this.prisma.ledgerEntry.create({
        data: {
          paymentId,
          accountId: 'PLATFORM',
          type: LedgerEntryType.REFUND,
          direction: LedgerDirection.DEBIT,
          amount: commission,
        },
      }),
      this.prisma.ledgerEntry.create({
        data: {
          paymentId,
          accountId: professionalId,
          type: LedgerEntryType.REFUND,
          direction: LedgerDirection.DEBIT,
          amount: amount - commission,
        },
      }),
    ]);
  }

  async getBalance(accountId: string) {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { accountId },
    });

    let balance = 0;
    for (const entry of entries) {
      if (entry.direction === LedgerDirection.CREDIT) {
        balance += entry.amount;
      } else {
        balance -= entry.amount;
      }
    }

    return { accountId, balance, currency: 'XOF' };
  }

  async getProfessionalWallet(professionalId: string) {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { accountId: professionalId },
      orderBy: { createdAt: 'desc' },
    });

    let availableBalance = 0;
    let totalEarned = 0;
    let totalPaidOut = 0;

    for (const entry of entries) {
      if (entry.type === LedgerEntryType.PROFESSIONAL_EARNING) {
        availableBalance += entry.amount;
        totalEarned += entry.amount;
      } else if (entry.type === LedgerEntryType.PAYOUT) {
        availableBalance -= entry.amount;
        totalPaidOut += entry.amount;
      } else if (entry.type === LedgerEntryType.REFUND && entry.direction === LedgerDirection.DEBIT) {
        availableBalance -= entry.amount;
      }
    }

    return {
      professionalId,
      availableBalance,
      totalEarned,
      totalPaidOut,
      currency: 'XOF',
    };
  }

  async getEntriesByPayment(paymentId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
