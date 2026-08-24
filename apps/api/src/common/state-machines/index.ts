import { BadRequestException } from '@nestjs/common';
import {
  ServiceRequestStatus,
  QuoteStatus,
  BookingStatus,
  PaymentStatus,
  DisputeStatus,
} from '@prisma/client';

type TransitionMap<T extends string> = Partial<Record<T, T[]>>;

function validateTransition<T extends string>(
  current: T,
  next: T,
  transitions: TransitionMap<T>,
  entityName: string,
): void {
  const allowed = transitions[current];
  if (!allowed || !allowed.includes(next)) {
    throw new BadRequestException(
      `Transition invalide pour ${entityName}: ${current} → ${next}`,
    );
  }
}

// ─── SERVICE REQUEST ────────────────────────────────────────────────────────────

const SERVICE_REQUEST_TRANSITIONS: TransitionMap<ServiceRequestStatus> = {
  [ServiceRequestStatus.DRAFT]: [ServiceRequestStatus.SUBMITTED, ServiceRequestStatus.CANCELLED],
  [ServiceRequestStatus.SUBMITTED]: [ServiceRequestStatus.MATCHING, ServiceRequestStatus.CANCELLED],
  [ServiceRequestStatus.MATCHING]: [ServiceRequestStatus.QUOTED, ServiceRequestStatus.CANCELLED],
  [ServiceRequestStatus.QUOTED]: [ServiceRequestStatus.ACCEPTED, ServiceRequestStatus.CANCELLED],
  [ServiceRequestStatus.ACCEPTED]: [ServiceRequestStatus.SCHEDULED, ServiceRequestStatus.CANCELLED, ServiceRequestStatus.DISPUTED],
  [ServiceRequestStatus.SCHEDULED]: [ServiceRequestStatus.IN_PROGRESS, ServiceRequestStatus.CANCELLED, ServiceRequestStatus.DISPUTED],
  [ServiceRequestStatus.IN_PROGRESS]: [ServiceRequestStatus.COMPLETED, ServiceRequestStatus.DISPUTED],
  [ServiceRequestStatus.COMPLETED]: [ServiceRequestStatus.DISPUTED],
  [ServiceRequestStatus.CANCELLED]: [],
  [ServiceRequestStatus.DISPUTED]: [],
};

export function validateServiceRequestTransition(current: ServiceRequestStatus, next: ServiceRequestStatus): void {
  validateTransition(current, next, SERVICE_REQUEST_TRANSITIONS, 'demande de service');
}

// ─── QUOTE ──────────────────────────────────────────────────────────────────────

const QUOTE_TRANSITIONS: TransitionMap<QuoteStatus> = {
  [QuoteStatus.PENDING]: [QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.EXPIRED],
  [QuoteStatus.ACCEPTED]: [],
  [QuoteStatus.REJECTED]: [],
  [QuoteStatus.EXPIRED]: [],
};

export function validateQuoteTransition(current: QuoteStatus, next: QuoteStatus): void {
  validateTransition(current, next, QUOTE_TRANSITIONS, 'devis');
}

// ─── BOOKING ────────────────────────────────────────────────────────────────────

const BOOKING_TRANSITIONS: TransitionMap<BookingStatus> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.ARRIVING, BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED, BookingStatus.DISPUTED],
  [BookingStatus.ARRIVING]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED, BookingStatus.DISPUTED],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.DISPUTED],
  [BookingStatus.COMPLETED]: [BookingStatus.DISPUTED],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.DISPUTED]: [],
};

export function validateBookingTransition(current: BookingStatus, next: BookingStatus): void {
  validateTransition(current, next, BOOKING_TRANSITIONS, 'réservation');
}

// ─── PAYMENT ────────────────────────────────────────────────────────────────────

const PAYMENT_TRANSITIONS: TransitionMap<PaymentStatus> = {
  [PaymentStatus.PENDING]: [PaymentStatus.PROCESSING, PaymentStatus.FAILED],
  [PaymentStatus.PROCESSING]: [PaymentStatus.COMPLETED, PaymentStatus.FAILED],
  [PaymentStatus.COMPLETED]: [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]: [PaymentStatus.PENDING],
  [PaymentStatus.REFUNDED]: [],
};

export function validatePaymentTransition(current: PaymentStatus, next: PaymentStatus): void {
  validateTransition(current, next, PAYMENT_TRANSITIONS, 'paiement');
}

// ─── DISPUTE ────────────────────────────────────────────────────────────────────

const DISPUTE_TRANSITIONS: TransitionMap<DisputeStatus> = {
  [DisputeStatus.OPEN]: [DisputeStatus.INVESTIGATING, DisputeStatus.RESOLVED, DisputeStatus.CLOSED],
  [DisputeStatus.INVESTIGATING]: [DisputeStatus.RESOLVED, DisputeStatus.CLOSED],
  [DisputeStatus.RESOLVED]: [DisputeStatus.CLOSED],
  [DisputeStatus.CLOSED]: [],
};

export function validateDisputeTransition(current: DisputeStatus, next: DisputeStatus): void {
  validateTransition(current, next, DISPUTE_TRANSITIONS, 'litige');
}
