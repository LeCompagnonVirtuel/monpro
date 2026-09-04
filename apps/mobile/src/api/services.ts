import { apiClient } from './client';

export interface Service {
  id: string;
  name: string;
  description?: string;
  subcategoryId: string;
  subcategory?: {
    id: string;
    name: string;
    categoryId: string;
    category?: { id: string; name: string };
  };
  basePrice?: number;
  isActive: boolean;
}

export interface ServiceSearchParams {
  categoryId?: string;
  subcategoryId?: string;
  search?: string;
}

export const servicesApi = {
  list(params?: ServiceSearchParams) {
    return apiClient.get<{ success: boolean; data: Service[] }>('/services', { params });
  },

  search(q: string) {
    return apiClient.get<{ success: boolean; data: Service[] }>('/services/search', {
      params: { q },
    });
  },

  getById(id: string) {
    return apiClient.get<{ success: boolean; data: Service }>(`/services/${id}`);
  },
};
