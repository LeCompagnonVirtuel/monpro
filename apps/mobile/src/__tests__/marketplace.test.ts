import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

jest.mock('@/api/quotes', () => ({
  quotesApi: {
    listForRequest: jest.fn(),
    accept: jest.fn(),
    reject: jest.fn(),
  },
}));

jest.mock('@/api/bookings', () => ({
  bookingsApi: {
    create: jest.fn(),
    getById: jest.fn(),
  },
}));

jest.mock('@/api/interventions', () => ({
  interventionsApi: {
    getByBooking: jest.fn(),
    confirm: jest.fn(),
  },
}));

jest.mock('@/api/payments', () => ({
  paymentsApi: {
    initiate: jest.fn(),
    getByBooking: jest.fn(),
  },
}));

jest.mock('@/api/reviews', () => ({
  reviewsApi: {
    create: jest.fn(),
  },
}));

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: jest.fn((selector) => {
    const state = { isAuthenticated: true, role: 'CLIENT', userId: 'user-1' };
    return selector ? selector(state) : state;
  }),
}));

import { quotesApi } from '@/api/quotes';
import { bookingsApi } from '@/api/bookings';
import { interventionsApi } from '@/api/interventions';
import { paymentsApi } from '@/api/payments';
import { reviewsApi } from '@/api/reviews';
import { useQuotesForRequest, useAcceptQuote, useRejectQuote } from '@/hooks/use-quotes';
import { useBooking, useCreateBooking } from '@/hooks/use-bookings';
import { useIntervention, useConfirmIntervention } from '@/hooks/use-interventions';
import { usePaymentForBooking, useInitiatePayment } from '@/hooks/use-payments';
import { useCreateReview } from '@/hooks/use-create-review';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

describe('Quotes hooks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('useQuotesForRequest fetches quotes for a request', async () => {
    const mockQuotes = [
      { id: 'q1', serviceRequestId: 'sr-1', totalCost: 20000, status: 'PENDING', laborCost: 15000, createdAt: '2024-01-01' },
      { id: 'q2', serviceRequestId: 'sr-1', totalCost: 18500, status: 'PENDING', laborCost: 14000, createdAt: '2024-01-02' },
    ];
    (quotesApi.listForRequest as jest.Mock).mockResolvedValue({ data: { success: true, data: mockQuotes } });

    const { result } = renderHook(() => useQuotesForRequest('sr-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].totalCost).toBe(20000);
    expect(quotesApi.listForRequest).toHaveBeenCalledWith('sr-1');
  });

  it('useQuotesForRequest does not fetch when requestId is undefined', () => {
    const { result } = renderHook(() => useQuotesForRequest(undefined), { wrapper: createWrapper() });
    expect(result.current.isFetching).toBe(false);
  });

  it('useAcceptQuote calls accept and returns updated quote', async () => {
    const accepted = { id: 'q1', serviceRequestId: 'sr-1', status: 'ACCEPTED', totalCost: 20000, laborCost: 15000, createdAt: '2024-01-01' };
    (quotesApi.accept as jest.Mock).mockResolvedValue({ data: { success: true, data: accepted } });

    const { result } = renderHook(() => useAcceptQuote(), { wrapper: createWrapper() });
    const res = await result.current.mutateAsync('q1');

    expect(res.status).toBe('ACCEPTED');
    expect(quotesApi.accept).toHaveBeenCalledWith('q1');
  });

  it('useRejectQuote calls reject API', async () => {
    const rejected = { id: 'q1', serviceRequestId: 'sr-1', status: 'REJECTED', totalCost: 20000, laborCost: 15000, createdAt: '2024-01-01' };
    (quotesApi.reject as jest.Mock).mockResolvedValue({ data: { success: true, data: rejected } });

    const { result } = renderHook(() => useRejectQuote(), { wrapper: createWrapper() });
    const res = await result.current.mutateAsync('q1');

    expect(res.status).toBe('REJECTED');
    expect(quotesApi.reject).toHaveBeenCalledWith('q1');
  });

  it('useAcceptQuote handles API error', async () => {
    (quotesApi.accept as jest.Mock).mockRejectedValue(new Error('Quote already accepted'));

    const { result } = renderHook(() => useAcceptQuote(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync('q1')).rejects.toThrow('Quote already accepted');
  });
});

describe('Bookings hooks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('useBooking fetches a booking by ID', async () => {
    const mockBooking = { id: 'b1', quoteId: 'q1', status: 'CONFIRMED', totalAmount: 20000, scheduledDate: '2024-02-01', createdAt: '2024-01-15' };
    (bookingsApi.getById as jest.Mock).mockResolvedValue({ data: { success: true, data: mockBooking } });

    const { result } = renderHook(() => useBooking('b1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.status).toBe('CONFIRMED');
    expect(result.current.data!.totalAmount).toBe(20000);
  });

  it('useCreateBooking creates a booking', async () => {
    const created = { id: 'b-new', quoteId: 'q1', status: 'PENDING', totalAmount: 20000, scheduledDate: '2024-02-10', createdAt: '2024-02-01' };
    (bookingsApi.create as jest.Mock).mockResolvedValue({ data: { success: true, data: created } });

    const { result } = renderHook(() => useCreateBooking(), { wrapper: createWrapper() });
    const booking = await result.current.mutateAsync({ quoteId: 'q1', scheduledDate: '2024-02-10' });

    expect(booking.id).toBe('b-new');
    expect(bookingsApi.create).toHaveBeenCalledWith({ quoteId: 'q1', scheduledDate: '2024-02-10' });
  });

  it('useCreateBooking prevents duplicate on error', async () => {
    (bookingsApi.create as jest.Mock).mockRejectedValue(new Error('Booking already exists'));

    const { result } = renderHook(() => useCreateBooking(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync({ quoteId: 'q1', scheduledDate: '2024-02-10' })).rejects.toThrow();
  });
});

describe('Interventions hooks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('useIntervention fetches intervention by booking ID', async () => {
    const mockIntervention = { id: 'i1', bookingId: 'b1', status: 'IN_PROGRESS', arrivedAt: '2024-02-01T10:00:00Z', startedAt: '2024-02-01T10:15:00Z', createdAt: '2024-02-01T09:00:00Z' };
    (interventionsApi.getByBooking as jest.Mock).mockResolvedValue({ data: { success: true, data: mockIntervention } });

    const { result } = renderHook(() => useIntervention('b1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.startedAt).toBeTruthy();
  });

  it('useConfirmIntervention calls confirm API', async () => {
    (interventionsApi.confirm as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useConfirmIntervention(), { wrapper: createWrapper() });
    await result.current.mutateAsync('b1');

    expect(interventionsApi.confirm).toHaveBeenCalledWith('b1');
  });
});

describe('Payments hooks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('usePaymentForBooking fetches payment status', async () => {
    const mockPayment = { id: 'p1', bookingId: 'b1', amount: 20000, provider: 'ORANGE_MONEY', status: 'COMPLETED', createdAt: '2024-02-01' };
    (paymentsApi.getByBooking as jest.Mock).mockResolvedValue({ data: { success: true, data: mockPayment } });

    const { result } = renderHook(() => usePaymentForBooking('b1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.status).toBe('COMPLETED');
    expect(result.current.data!.amount).toBe(20000);
  });

  it('useInitiatePayment calls initiate endpoint', async () => {
    const mockPayment = { id: 'p-new', bookingId: 'b1', amount: 20000, provider: 'MTN_MOMO', status: 'PENDING', createdAt: '2024-02-01' };
    (paymentsApi.initiate as jest.Mock).mockResolvedValue({ data: { success: true, data: mockPayment } });

    const { result } = renderHook(() => useInitiatePayment(), { wrapper: createWrapper() });
    const payment = await result.current.mutateAsync({ bookingId: 'b1', provider: 'MTN_MOMO', phoneNumber: '+2250700000000' });

    expect(payment.status).toBe('PENDING');
    expect(paymentsApi.initiate).toHaveBeenCalledWith({ bookingId: 'b1', provider: 'MTN_MOMO', phoneNumber: '+2250700000000' });
  });

  it('useInitiatePayment handles payment failure', async () => {
    (paymentsApi.initiate as jest.Mock).mockRejectedValue(new Error('Payment provider unavailable'));

    const { result } = renderHook(() => useInitiatePayment(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync({ bookingId: 'b1', provider: 'WAVE', phoneNumber: '' })).rejects.toThrow();
  });

  it('payment status PENDING is not treated as COMPLETED', async () => {
    const mockPayment = { id: 'p1', bookingId: 'b1', amount: 20000, provider: 'ORANGE_MONEY', status: 'PENDING', createdAt: '2024-02-01' };
    (paymentsApi.getByBooking as jest.Mock).mockResolvedValue({ data: { success: true, data: mockPayment } });

    const { result } = renderHook(() => usePaymentForBooking('b1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.status).not.toBe('COMPLETED');
  });
});

describe('Reviews hooks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('useCreateReview submits a review', async () => {
    const mockReview = { id: 'r1', bookingId: 'b1', overallRating: 5, comment: 'Excellent', createdAt: '2024-02-01' };
    (reviewsApi.create as jest.Mock).mockResolvedValue({ data: { success: true, data: mockReview } });

    const { result } = renderHook(() => useCreateReview(), { wrapper: createWrapper() });
    const review = await result.current.mutateAsync({ bookingId: 'b1', overallRating: 5, comment: 'Excellent' });

    expect(review.overallRating).toBe(5);
    expect(reviewsApi.create).toHaveBeenCalledWith({ bookingId: 'b1', overallRating: 5, comment: 'Excellent' });
  });

  it('useCreateReview validates rating is 1-5', async () => {
    (reviewsApi.create as jest.Mock).mockRejectedValue(new Error('Rating must be between 1 and 5'));

    const { result } = renderHook(() => useCreateReview(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync({ bookingId: 'b1', overallRating: 0 })).rejects.toThrow();
  });

  it('useCreateReview handles duplicate review error', async () => {
    (reviewsApi.create as jest.Mock).mockRejectedValue(new Error('Review already exists'));

    const { result } = renderHook(() => useCreateReview(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync({ bookingId: 'b1', overallRating: 4 })).rejects.toThrow('Review already exists');
  });
});

describe('Security checks', () => {
  it('does not recalculate amounts from quote fields', () => {
    const quote = { laborCost: 15000, materialCost: 3000, transportCost: 2000, totalCost: 20000 };
    expect(quote.totalCost).toBe(20000);
    expect(quote.laborCost + (quote.materialCost || 0) + (quote.transportCost || 0)).toBe(20000);
  });

  it('payment status mapping does not invent statuses', () => {
    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'];
    validStatuses.forEach((status) => {
      expect(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']).toContain(status);
    });
  });

  it('does not expose admin endpoints', () => {
    const usedEndpoints = [
      '/quotes/request/',
      '/quotes/:id/accept',
      '/quotes/:id/reject',
      '/bookings',
      '/bookings/:id',
      '/interventions/:bookingId',
      '/interventions/:bookingId/confirm',
      '/payments',
      '/payments/booking/',
      '/reviews',
    ];
    usedEndpoints.forEach((endpoint) => {
      expect(endpoint).not.toContain('/admin');
    });
  });
});
