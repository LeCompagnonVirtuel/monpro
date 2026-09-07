import { apiClient } from './client';

export type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type ServiceRequestStatus =
  | 'DRAFT' | 'SUBMITTED' | 'MATCHING' | 'QUOTED'
  | 'ACCEPTED' | 'SCHEDULED' | 'IN_PROGRESS'
  | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export interface ServiceRequestMedia {
  id: string;
  url: string;
  mimeType: string;
}

export interface ServiceRequestAddress {
  id: string;
  label?: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  serviceId: string;
  title: string;
  description: string;
  urgency: UrgencyLevel;
  status: ServiceRequestStatus;
  preferredDate?: string;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  addressId?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  service?: { id: string; name: string };
  client?: { fullName: string; avatarUrl?: string };
  media?: ServiceRequestMedia[];
  address?: ServiceRequestAddress;
}

export interface CreateServiceRequestPayload {
  serviceId: string;
  title: string;
  description: string;
  urgency?: UrgencyLevel;
  addressId?: string;
  latitude?: number;
  longitude?: number;
  preferredDate?: string;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  mediaUrls?: string[];
}

export const requestsApi = {
  create(payload: CreateServiceRequestPayload) {
    return apiClient.post<{ success: boolean; data: ServiceRequest }>(
      '/service-requests',
      payload,
    );
  },

  listMine(params?: { status?: ServiceRequestStatus; page?: number; limit?: number }) {
    return apiClient.get<{ success: boolean; data: ServiceRequest[]; total: number }>(
      '/service-requests',
      { params },
    );
  },

  getAvailable(params?: { professionalId?: string; status?: ServiceRequestStatus; page?: number; limit?: number }) {
    return apiClient.get<{ success: boolean; data: ServiceRequest[]; total: number }>(
      '/service-requests/available',
      { params },
    );
  },

  getById(id: string) {
    return apiClient.get<{ success: boolean; data: ServiceRequest }>(`/service-requests/${id}`);
  },

  updateStatus(id: string, status: ServiceRequestStatus) {
    return apiClient.patch(`/service-requests/${id}/status`, { status });
  },
};
