import { apiClient } from './client';

export interface Address {
  id: string;
  userId: string;
  label?: string;
  fullAddress: string;
  districtId?: string;
  neighborhoodId?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateAddressPayload {
  label?: string;
  fullAddress: string;
  districtId?: string;
  neighborhoodId?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface UpdateAddressPayload {
  label?: string;
  fullAddress?: string;
  districtId?: string;
  neighborhoodId?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export const addressesApi = {
  list() {
    return apiClient.get<{ success: boolean; data: Address[] }>('/addresses');
  },

  create(payload: CreateAddressPayload) {
    return apiClient.post<{ success: boolean; data: Address }>('/addresses', payload);
  },

  update(id: string, payload: UpdateAddressPayload) {
    return apiClient.patch<{ success: boolean; data: Address }>(`/addresses/${id}`, payload);
  },

  delete(id: string) {
    return apiClient.delete(`/addresses/${id}`);
  },

  setDefault(id: string) {
    return apiClient.patch(`/addresses/${id}/default`);
  },
};
