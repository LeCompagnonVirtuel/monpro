import { apiClient } from './client';

export interface ProfessionalService {
  id: string;
  professionalId: string;
  serviceId: string;
  service: {
    id: string;
    name: string;
    description?: string;
    subcategory?: {
      id: string;
      name: string;
      category?: {
        id: string;
        name: string;
      };
    };
  };
  priceMin?: number;
  priceMax?: number;
  description?: string;
  createdAt: string;
}

export interface UpdateProfessionalServicePayload {
  priceMin?: number;
  priceMax?: number;
  description?: string;
}

export const professionalServicesApi = {
  list(professionalId: string) {
    return apiClient.get<{ success: boolean; data: ProfessionalService[] }>(`/professionals/${professionalId}/services`);
  },

  add(professionalId: string, serviceId: string, payload?: UpdateProfessionalServicePayload) {
    return apiClient.post<{ success: boolean; data: ProfessionalService }>(`/professionals/${professionalId}/services/${serviceId}`, payload);
  },

  update(professionalId: string, serviceId: string, payload: UpdateProfessionalServicePayload) {
    return apiClient.patch<{ success: boolean; data: ProfessionalService }>(`/professionals/${professionalId}/services/${serviceId}`, payload);
  },

  remove(professionalId: string, serviceId: string) {
    return apiClient.delete(`/professionals/${professionalId}/services/${serviceId}`);
  },
};
