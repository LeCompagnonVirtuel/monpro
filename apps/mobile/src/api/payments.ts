import { apiClient } from './client';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentProvider = 'ORANGE_MONEY' | 'MTN_MOMO' | 'MOOV_MONEY' | 'WAVE';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  commission: number;
  professionalAmount: number;
  commissionRate: number;
  provider?: PaymentProvider;
  providerRef?: string;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitiatePaymentPayload {
  bookingId: string;
  provider: PaymentProvider;
  phoneNumber: string;
}

export const paymentsApi = {
  initiate(payload: InitiatePaymentPayload) {
    return apiClient.post<{ success: boolean; data: Payment }>('/payments', payload);
  },

  getByBooking(bookingId: string) {
    return apiClient.get<{ success: boolean; data: Payment }>(`/payments/booking/${bookingId}`);
  },
};
