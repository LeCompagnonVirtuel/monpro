import { apiClient } from './client';

export interface Intervention {
  id: string;
  bookingId: string;
  beforePhotos: string[];
  afterPhotos: string[];
  completionNotes?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  clientConfirmed: boolean;
  clientConfirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const interventionsApi = {
  create(bookingId: string) {
    return apiClient.post<{ success: boolean; data: Intervention }>(
      `/interventions/${bookingId}`,
    );
  },

  getByBooking(bookingId: string) {
    return apiClient.get<{ success: boolean; data: Intervention }>(
      `/interventions/${bookingId}`,
    );
  },

  markArrived(bookingId: string) {
    return apiClient.patch(`/interventions/${bookingId}/arrived`);
  },

  start(bookingId: string, beforePhotos: string[]) {
    return apiClient.patch(`/interventions/${bookingId}/start`, { beforePhotos });
  },

  complete(bookingId: string, afterPhotos: string[], completionNotes?: string) {
    return apiClient.patch(`/interventions/${bookingId}/complete`, { afterPhotos, completionNotes });
  },

  confirm(bookingId: string) {
    return apiClient.patch(`/interventions/${bookingId}/confirm`);
  },
};
