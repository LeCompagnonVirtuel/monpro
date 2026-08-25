import { apiClient } from './client';

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  professionalId: string;
  overallRating: number;
  qualityRating?: number;
  punctualityRating?: number;
  communicationRating?: number;
  valuePriceRating?: number;
  comment?: string;
  response?: string;
  createdAt: string;
  client?: { fullName: string; avatarUrl?: string };
}

export interface CreateReviewPayload {
  bookingId: string;
  overallRating: number;
  qualityRating?: number;
  punctualityRating?: number;
  communicationRating?: number;
  valuePriceRating?: number;
  comment?: string;
}

export const reviewsApi = {
  create(payload: CreateReviewPayload) {
    return apiClient.post<{ success: boolean; data: Review }>('/reviews', payload);
  },

  listByProfessional(professionalId: string, params?: { page?: number; limit?: number }) {
    return apiClient.get<{ success: boolean; data: Review[]; total: number }>(
      `/reviews/professional/${professionalId}`,
      { params },
    );
  },

  respond(id: string, response: string) {
    return apiClient.patch(`/reviews/${id}/respond`, { response });
  },
};
