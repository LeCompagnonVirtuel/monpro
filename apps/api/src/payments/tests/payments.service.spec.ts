import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentsService } from '../payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentProviderFactory } from '../providers/payment-provider.factory';
import { LedgerService } from '../../ledger/ledger.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { BookingStatus, PaymentProvider, PaymentStatus } from '@prisma/client';

describe('PaymentsService — IDOR & Financial Security', () => {
  let service: PaymentsService;
  let prisma: any;

  const mockProvider = {
    initiate: jest.fn().mockResolvedValue({ providerRef: 'REF-123', status: 'pending', metadata: {} }),
    parseWebhook: jest.fn(),
    verifyWebhookSignature: jest.fn(),
    checkStatus: jest.fn(),
  };

  const mockPrisma = {
    booking: { findUnique: jest.fn() },
    commissionConfig: { findFirst: jest.fn() },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    paymentTransaction: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ledgerEntry: { count: jest.fn().mockResolvedValue(0) },
    professional: { findUnique: jest.fn().mockResolvedValue({ id: 'pro-1', userId: 'user-pro-1' }) },
  };

  const mockProviderFactory = {
    getProvider: jest.fn().mockReturnValue(mockProvider),
  };

  const mockLedger = {
    recordPayment: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotifications = {
    create: jest.fn().mockResolvedValue(undefined),
    sendPush: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PaymentProviderFactory, useValue: mockProviderFactory },
        { provide: LedgerService, useValue: mockLedger },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get(PaymentsService);
    jest.clearAllMocks();
    mockProviderFactory.getProvider.mockReturnValue(mockProvider);
  });

  describe('initiate — IDOR', () => {
    it('should REJECT payment initiation by non-owner of the booking', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.COMPLETED,
        totalAmount: 20000,
        serviceRequest: { clientId: 'client-A' },
      });

      await expect(
        service.initiate('booking-1', PaymentProvider.ORANGE_MONEY, '+225070000', 'client-B'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should REJECT payment if booking is not COMPLETED', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        totalAmount: 20000,
        serviceRequest: { clientId: 'client-A' },
      });

      await expect(
        service.initiate('booking-1', PaymentProvider.ORANGE_MONEY, '+225070000', 'client-A'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate commission from config, NOT from user input', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.COMPLETED,
        totalAmount: 20000,
        serviceRequest: { clientId: 'client-A' },
      });
      mockPrisma.commissionConfig.findFirst.mockResolvedValue({ rate: 0.15 });
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-1' });
      mockPrisma.paymentTransaction.create.mockResolvedValue({});

      await service.initiate('booking-1', PaymentProvider.ORANGE_MONEY, '+225070000', 'client-A');

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 20000,
          commission: 3000, // 20000 * 0.15
          professionalAmount: 17000, // 20000 - 3000
          commissionRate: 0.15,
        }),
      });
    });

    it('should use amount from booking, NOT from user request body', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.COMPLETED,
        totalAmount: 50000, // Real amount
        serviceRequest: { clientId: 'client-A' },
      });
      mockPrisma.commissionConfig.findFirst.mockResolvedValue({ rate: 0.10 });
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-1' });
      mockPrisma.paymentTransaction.create.mockResolvedValue({});

      // User cannot manipulate the amount — it comes from booking.totalAmount
      await service.initiate('booking-1', PaymentProvider.ORANGE_MONEY, '+225070000', 'client-A');

      expect(mockProvider.initiate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 50000 }),
      );
    });
  });

  describe('findByBooking — IDOR', () => {
    it('should REJECT access by unrelated user', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        professionalId: 'pro-1',
        professional: { userId: 'user-pro-1' },
        serviceRequest: { clientId: 'client-A' },
      });

      await expect(
        service.findByBooking('booking-1', 'random-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should ALLOW access by client', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        professionalId: 'pro-1',
        professional: { userId: 'user-pro-1' },
        serviceRequest: { clientId: 'client-A' },
      });
      mockPrisma.payment.findUnique.mockResolvedValue({ id: 'pay-1', amount: 20000 });

      const result = await service.findByBooking('booking-1', 'client-A');
      expect(result).toBeDefined();
    });

    it('should ALLOW access by professional (using userId, not professionalId)', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        professionalId: 'pro-1',
        professional: { userId: 'user-pro-1' },
        serviceRequest: { clientId: 'client-A' },
      });
      mockPrisma.payment.findUnique.mockResolvedValue({ id: 'pay-1', amount: 20000 });

      const result = await service.findByBooking('booking-1', 'user-pro-1');
      expect(result).toBeDefined();
    });
  });

  describe('handleWebhook — idempotency', () => {
    it('should handle unknown providerRef gracefully', async () => {
      mockProvider.parseWebhook.mockReturnValue({ providerRef: 'UNKNOWN', success: true });
      mockPrisma.paymentTransaction.findUnique.mockResolvedValue(null);

      const result = await service.handleWebhook(PaymentProvider.ORANGE_MONEY, {});
      expect(result).toEqual({ received: true });
    });

    it('should update payment status based on webhook, NOT user input', async () => {
      mockProvider.parseWebhook.mockReturnValue({ providerRef: 'REF-1', success: true });
      mockPrisma.paymentTransaction.findUnique.mockResolvedValue({
        id: 'tx-1',
        paymentId: 'pay-1',
        providerRef: 'REF-1',
        processedAt: null,
        payment: { id: 'pay-1', bookingId: 'booking-1', amount: 20000, commission: 3000, professionalAmount: 17000 },
      });
      mockPrisma.paymentTransaction.update.mockResolvedValue({});
      mockPrisma.payment.update.mockResolvedValue({});
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1', professionalId: 'pro-1',
        serviceRequest: { clientId: 'client-1' },
      });

      const result = await service.handleWebhook(PaymentProvider.ORANGE_MONEY, { status: 'success' });
      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(mockPrisma.paymentTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ processedAt: expect.any(Date) }),
        }),
      );
    });

    it('should IGNORE duplicate webhook — already processed transaction returns early', async () => {
      mockProvider.parseWebhook.mockReturnValue({ providerRef: 'REF-1', success: true });
      mockPrisma.paymentTransaction.findUnique.mockResolvedValue({
        id: 'tx-1',
        paymentId: 'pay-1',
        providerRef: 'REF-1',
        processedAt: new Date('2024-01-01T00:00:00Z'),
        payment: { id: 'pay-1' },
      });

      const result = await service.handleWebhook(PaymentProvider.ORANGE_MONEY, { status: 'success' });

      expect(result).toEqual({ received: true, alreadyProcessed: true });
      expect(mockPrisma.paymentTransaction.update).not.toHaveBeenCalled();
      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    });

    it('should use compound key (provider, providerRef) for lookup', async () => {
      mockProvider.parseWebhook.mockReturnValue({ providerRef: 'REF-1', success: true });
      mockPrisma.paymentTransaction.findUnique.mockResolvedValue(null);

      await service.handleWebhook(PaymentProvider.ORANGE_MONEY, {});

      expect(mockPrisma.paymentTransaction.findUnique).toHaveBeenCalledWith({
        where: { provider_providerRef: { provider: PaymentProvider.ORANGE_MONEY, providerRef: 'REF-1' } },
        include: { payment: true },
      });
    });
  });
});
