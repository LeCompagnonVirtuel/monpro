import { BadRequestException } from '@nestjs/common';
import {
  validateServiceRequestTransition,
  validateQuoteTransition,
  validateBookingTransition,
  validatePaymentTransition,
  validateDisputeTransition,
} from './index';
import {
  ServiceRequestStatus,
  QuoteStatus,
  BookingStatus,
  PaymentStatus,
  DisputeStatus,
} from '@prisma/client';

describe('State Machines', () => {
  describe('ServiceRequest', () => {
    it('should allow DRAFT → SUBMITTED', () => {
      expect(() => validateServiceRequestTransition(ServiceRequestStatus.DRAFT, ServiceRequestStatus.SUBMITTED)).not.toThrow();
    });

    it('should allow SUBMITTED → MATCHING', () => {
      expect(() => validateServiceRequestTransition(ServiceRequestStatus.SUBMITTED, ServiceRequestStatus.MATCHING)).not.toThrow();
    });

    it('should allow IN_PROGRESS → COMPLETED', () => {
      expect(() => validateServiceRequestTransition(ServiceRequestStatus.IN_PROGRESS, ServiceRequestStatus.COMPLETED)).not.toThrow();
    });

    it('should REJECT DRAFT → COMPLETED (skip states)', () => {
      expect(() => validateServiceRequestTransition(ServiceRequestStatus.DRAFT, ServiceRequestStatus.COMPLETED)).toThrow(BadRequestException);
    });

    it('should REJECT CANCELLED → anything', () => {
      expect(() => validateServiceRequestTransition(ServiceRequestStatus.CANCELLED, ServiceRequestStatus.SUBMITTED)).toThrow(BadRequestException);
    });

    it('should REJECT COMPLETED → CANCELLED (terminal)', () => {
      expect(() => validateServiceRequestTransition(ServiceRequestStatus.COMPLETED, ServiceRequestStatus.CANCELLED)).toThrow(BadRequestException);
    });

    it('should allow COMPLETED → DISPUTED', () => {
      expect(() => validateServiceRequestTransition(ServiceRequestStatus.COMPLETED, ServiceRequestStatus.DISPUTED)).not.toThrow();
    });
  });

  describe('Quote', () => {
    it('should allow PENDING → ACCEPTED', () => {
      expect(() => validateQuoteTransition(QuoteStatus.PENDING, QuoteStatus.ACCEPTED)).not.toThrow();
    });

    it('should allow PENDING → REJECTED', () => {
      expect(() => validateQuoteTransition(QuoteStatus.PENDING, QuoteStatus.REJECTED)).not.toThrow();
    });

    it('should allow PENDING → EXPIRED', () => {
      expect(() => validateQuoteTransition(QuoteStatus.PENDING, QuoteStatus.EXPIRED)).not.toThrow();
    });

    it('should REJECT ACCEPTED → REJECTED (terminal)', () => {
      expect(() => validateQuoteTransition(QuoteStatus.ACCEPTED, QuoteStatus.REJECTED)).toThrow(BadRequestException);
    });

    it('should REJECT REJECTED → ACCEPTED (terminal)', () => {
      expect(() => validateQuoteTransition(QuoteStatus.REJECTED, QuoteStatus.ACCEPTED)).toThrow(BadRequestException);
    });
  });

  describe('Booking', () => {
    it('should allow CONFIRMED → IN_PROGRESS', () => {
      expect(() => validateBookingTransition(BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS)).not.toThrow();
    });

    it('should allow CONFIRMED → ARRIVING', () => {
      expect(() => validateBookingTransition(BookingStatus.CONFIRMED, BookingStatus.ARRIVING)).not.toThrow();
    });

    it('should allow IN_PROGRESS → COMPLETED', () => {
      expect(() => validateBookingTransition(BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED)).not.toThrow();
    });

    it('should REJECT COMPLETED → IN_PROGRESS (no rollback)', () => {
      expect(() => validateBookingTransition(BookingStatus.COMPLETED, BookingStatus.IN_PROGRESS)).toThrow(BadRequestException);
    });

    it('should REJECT CANCELLED → CONFIRMED', () => {
      expect(() => validateBookingTransition(BookingStatus.CANCELLED, BookingStatus.CONFIRMED)).toThrow(BadRequestException);
    });

    it('should allow CONFIRMED → CANCELLED', () => {
      expect(() => validateBookingTransition(BookingStatus.CONFIRMED, BookingStatus.CANCELLED)).not.toThrow();
    });

    it('should REJECT IN_PROGRESS → CANCELLED (must complete or dispute)', () => {
      expect(() => validateBookingTransition(BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED)).toThrow(BadRequestException);
    });
  });

  describe('Payment', () => {
    it('should allow PENDING → PROCESSING', () => {
      expect(() => validatePaymentTransition(PaymentStatus.PENDING, PaymentStatus.PROCESSING)).not.toThrow();
    });

    it('should allow PROCESSING → COMPLETED', () => {
      expect(() => validatePaymentTransition(PaymentStatus.PROCESSING, PaymentStatus.COMPLETED)).not.toThrow();
    });

    it('should allow COMPLETED → REFUNDED', () => {
      expect(() => validatePaymentTransition(PaymentStatus.COMPLETED, PaymentStatus.REFUNDED)).not.toThrow();
    });

    it('should REJECT REFUNDED → anything (terminal)', () => {
      expect(() => validatePaymentTransition(PaymentStatus.REFUNDED, PaymentStatus.PENDING)).toThrow(BadRequestException);
    });

    it('should REJECT direct PENDING → COMPLETED (must go through PROCESSING)', () => {
      expect(() => validatePaymentTransition(PaymentStatus.PENDING, PaymentStatus.COMPLETED)).toThrow(BadRequestException);
    });
  });

  describe('Dispute', () => {
    it('should allow OPEN → INVESTIGATING', () => {
      expect(() => validateDisputeTransition(DisputeStatus.OPEN, DisputeStatus.INVESTIGATING)).not.toThrow();
    });

    it('should allow INVESTIGATING → RESOLVED', () => {
      expect(() => validateDisputeTransition(DisputeStatus.INVESTIGATING, DisputeStatus.RESOLVED)).not.toThrow();
    });

    it('should REJECT CLOSED → OPEN', () => {
      expect(() => validateDisputeTransition(DisputeStatus.CLOSED, DisputeStatus.OPEN)).toThrow(BadRequestException);
    });
  });
});
