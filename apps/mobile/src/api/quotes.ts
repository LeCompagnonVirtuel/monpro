import { apiClient } from './client';

export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface Quote {
  id: string;
  serviceRequestId: string;
  professionalId: string;
  laborCost: number;
  materialCost?: number;
  transportCost?: number;
  totalCost: number;
  description?: string;
  estimatedDuration?: string;
  validUntil?: string;
  status: QuoteStatus;
  createdAt: string;
  professional?: {
    id: string;
    businessName?: string;
    user?: { fullName: string; avatarUrl?: string };
    rating?: number;
    isVerified: boolean;
  };
}

export interface CreateQuotePayload {
  serviceRequestId: string;
  laborCost: number;
  materialCost?: number;
  transportCost?: number;
  description?: string;
  estimatedDuration?: string;
  validUntil?: string;
}

export const quotesApi = {
  create(payload: CreateQuotePayload) {
    return apiClient.post<{ success: boolean; data: Quote }>('/quotes', payload);
  },

  listForRequest(requestId: string) {
    return apiClient.get<{ success: boolean; data: Quote[] }>(`/quotes/request/${requestId}`);
  },

  listByProfessional(professionalId: string, params?: { page?: number; limit?: number }) {
    return apiClient.get<{ success: boolean; data: Quote[]; total: number }>(
      `/quotes/professional/${professionalId}`,
      { params },
    );
  },

  accept(id: string) {
    return apiClient.patch<{ success: boolean; data: Quote }>(`/quotes/${id}/accept`);
  },

  reject(id: string) {
    return apiClient.patch<{ success: boolean; data: Quote }>(`/quotes/${id}/reject`);
  },
};
