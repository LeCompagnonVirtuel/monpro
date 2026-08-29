import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingsService } from '../bookings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { BookingStatus, QuoteStatus, ServiceRequestStatus } from '@prisma/client';

describe('BookingsService — IDOR & Authorization', () => {
  let service: BookingsService;
  let prisma: any;

  const mockPrisma = {
    quote: { findUnique: jest.fn() },
    booking: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    professional: { findUnique: jest.fn().mockResolvedValue({ id: 'pro-1', userId: 'user-pro-1' }) },
    serviceRequest: { update: jest.fn() },
    $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
  };

  const mockNotifications = {
    create: jest.fn().mockResolvedValue(undefined),
    sendPush: jest.fn().mockResolvedValue(undefined),
  };

  const mockRealtimeService = {
    emitToUser: jest.fn(),
    emitToUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: RealtimeService, useValue: mockRealtimeService },
      ],
    }).compile();

    service = module.get(BookingsService);
    jest.clearAllMocks();
  });

  describe('createFromQuote — IDOR', () => {
    it('should REJECT booking creation by non-owner of the service request', async () => {
      mockPrisma.quote.findUnique.mockResolvedValue({
        id: 'quote-1',
        status: QuoteStatus.ACCEPTED,
        professionalId: 'pro-1',
        serviceRequestId: 'sr-1',
        serviceRequest: { clientId: 'client-A', addressId: 'addr-1' },
        totalAmount: 15000,
      });

      await expect(
        service.createFromQuote('quote-1', { scheduledDate: new Date() }, 'client-B'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should ALLOW booking creation by the actual client', async () => {
      mockPrisma.quote.findUnique.mockResolvedValue({
        id: 'quote-1',
        status: QuoteStatus.ACCEPTED,
        professionalId: 'pro-1',
        serviceRequestId: 'sr-1',
        serviceRequest: { clientId: 'client-A', addressId: 'addr-1' },
        totalAmount: 15000,
      });
      mockPrisma.booking.findUnique.mockResolvedValueOnce(null); // no existing
      mockPrisma.booking.create.mockResolvedValue({ id: 'booking-1' });
      mockPrisma.serviceRequest.update.mockResolvedValue({});
      // findOne call
      mockPrisma.booking.findUnique.mockResolvedValueOnce({
        id: 'booking-1',
        serviceRequest: { service: {}, client: {} },
        quote: {},
        professional: { user: {} },
        address: {},
        payment: null,
        review: null,
      });

      const result = await service.createFromQuote('quote-1', { scheduledDate: new Date() }, 'client-A');
      expect(result).toBeDefined();
    });

    it('should REJECT if quote is not ACCEPTED', async () => {
      mockPrisma.quote.findUnique.mockResolvedValue({
        id: 'quote-1',
        status: QuoteStatus.PENDING,
        serviceRequest: { clientId: 'client-A' },
      });

      await expect(
        service.createFromQuote('quote-1', { scheduledDate: new Date() }, 'client-A'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus — IDOR & Role-based authorization', () => {
    const mockBooking = {
      id: 'booking-1',
      serviceRequestId: 'sr-1',
      professionalId: 'pro-1',
      status: BookingStatus.CONFIRMED,
      serviceRequest: { clientId: 'client-A' },
      professional: { userId: 'user-pro-1' },
    };

    it('should REJECT status update by unrelated user', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.updateStatus('booking-1', BookingStatus.IN_PROGRESS, 'random-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should REJECT cancellation by professional (only client can cancel)', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.updateStatus('booking-1', BookingStatus.CANCELLED, 'user-pro-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should ALLOW cancellation by client', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrisma.booking.update.mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED });

      const result = await service.updateStatus('booking-1', BookingStatus.CANCELLED, 'client-A');
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should REJECT IN_PROGRESS by client (only professional can start)', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking); // status: CONFIRMED

      await expect(
        service.updateStatus('booking-1', BookingStatus.IN_PROGRESS, 'client-A'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should ALLOW IN_PROGRESS by professional (from CONFIRMED)', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking); // status: CONFIRMED
      mockPrisma.booking.update.mockResolvedValue({ ...mockBooking, status: BookingStatus.IN_PROGRESS });

      const result = await service.updateStatus('booking-1', BookingStatus.IN_PROGRESS, 'user-pro-1');
      expect(result.status).toBe(BookingStatus.IN_PROGRESS);
    });

    it('should REJECT COMPLETED by client (only professional)', async () => {
      const inProgressBooking = { ...mockBooking, status: BookingStatus.IN_PROGRESS };
      mockPrisma.booking.findUnique.mockResolvedValue(inProgressBooking);

      await expect(
        service.updateStatus('booking-1', BookingStatus.COMPLETED, 'client-A'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should ALLOW COMPLETED by professional (from IN_PROGRESS) and update serviceRequest', async () => {
      const inProgressBooking = { ...mockBooking, status: BookingStatus.IN_PROGRESS };
      mockPrisma.booking.findUnique.mockResolvedValue(inProgressBooking);
      mockPrisma.serviceRequest.update.mockResolvedValue({});
      mockPrisma.booking.update.mockResolvedValue({ ...inProgressBooking, status: BookingStatus.COMPLETED });

      const result = await service.updateStatus('booking-1', BookingStatus.COMPLETED, 'user-pro-1');
      expect(result.status).toBe(BookingStatus.COMPLETED);
      expect(mockPrisma.serviceRequest.update).toHaveBeenCalledWith({
        where: { id: 'sr-1' },
        data: { status: ServiceRequestStatus.COMPLETED },
      });
    });

    it('should REJECT invalid state transition (COMPLETED → IN_PROGRESS)', async () => {
      const completedBooking = { ...mockBooking, status: BookingStatus.COMPLETED };
      mockPrisma.booking.findUnique.mockResolvedValue(completedBooking);

      await expect(
        service.updateStatus('booking-1', BookingStatus.IN_PROGRESS, 'user-pro-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
