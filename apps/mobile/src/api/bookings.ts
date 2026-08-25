import { apiClient } from './client';

export type BookingStatus =
  | 'PENDING' | 'CONFIRMED' | 'ARRIVING'
  | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export interface Booking {
  id: string;
  quoteId: string;
  clientId: string;
  professionalId: string;
  scheduledDate: string;
  scheduledTime?: string;
  status: BookingStatus;
  totalAmount: number;
  addressId?: string;
  createdAt: string;
  quote?: { id: string; totalCost: number };
  professional?: { id: string; businessName?: string; user?: { fullName: string } };
}

export interface CreateBookingPayload {
  quoteId: string;
  scheduledDate: string;
  scheduledTime?: string;
  addressId?: string;
}

export const bookingsApi = {
  create(payload: CreateBookingPayload) {
    return apiClient.post<{ success: boolean; data: Booking }>('/bookings', payload);
  },

  getById(id: string) {
    return apiClient.get<{ success: boolean; data: Booking }>(`/bookings/${id}`);
  },

  listByProfessional(professionalId: string, params?: { status?: BookingStatus; page?: number; limit?: number }) {
    return apiClient.get<{ success: boolean; data: Booking[]; total: number }>(
      `/bookings/professional/${professionalId}`,
      { params },
    );
  },

  updateStatus(id: string, status: BookingStatus) {
    return apiClient.patch(`/bookings/${id}/status`, { status });
  },
};
