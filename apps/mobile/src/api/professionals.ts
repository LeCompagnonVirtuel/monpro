import { apiClient } from './client';

export interface ProfessionalZone {
  id?: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number;
}

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
      category?: { id: string; name: string };
    };
  };
  priceMin?: number;
  priceMax?: number;
  description?: string;
}

export interface Professional {
  id: string;
  userId: string;
  businessName?: string;
  description?: string;
  experienceYears?: number;
  isAvailable: boolean;
  isVerified: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  averageRating: number;
  totalReviews: number;
  user?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    phone: string;
  };
  services?: ProfessionalService[];
  zones?: ProfessionalZone[];
}

export interface ProfessionalListParams {
  serviceId?: string;
  categoryId?: string;
  verified?: boolean;
  available?: boolean;
  search?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
}

export interface ProfessionalMatchParams {
  serviceId: string;
  latitude?: number;
  longitude?: number;
}

export const professionalsApi = {
  getMe() {
    return apiClient.get<{ success: boolean; data: Professional }>('/professionals/me');
  },

  list(params?: ProfessionalListParams) {
    return apiClient.get<{ success: boolean; data: Professional[]; total: number }>(
      '/professionals',
      { params },
    );
  },

  getById(id: string) {
    return apiClient.get<{ success: boolean; data: Professional }>(`/professionals/${id}`);
  },

  match(params: ProfessionalMatchParams) {
    return apiClient.get<{ success: boolean; data: Professional[] }>(
      '/professionals/match',
      { params },
    );
  },

  create(payload: { businessName?: string; description?: string; experienceYears?: number; serviceIds?: string[]; zones?: ProfessionalZone[] }) {
    return apiClient.post<{ success: boolean; data: Professional }>('/professionals', payload);
  },

  update(id: string, payload: { businessName?: string; description?: string; experienceYears?: number; isAvailable?: boolean; serviceIds?: string[]; zones?: ProfessionalZone[] }) {
    return apiClient.patch<{ success: boolean; data: Professional }>(`/professionals/${id}`, payload);
  },

  getAvailability(professionalId: string) {
    return apiClient.get(`/professionals/${professionalId}/availability`);
  },

  setAvailability(professionalId: string, slots: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[]) {
    return apiClient.put(`/professionals/${professionalId}/availability`, { slots });
  },
};
