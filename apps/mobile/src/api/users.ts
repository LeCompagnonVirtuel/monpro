import { apiClient } from './client';

export interface User {
  id: string;
  phone: string;
  fullName: string;
  role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
  avatarUrl?: string;
  cityId?: string;
  city?: { id: string; name: string };
  country?: { id: string; name: string };
  email?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  avatarUrl?: string;
  cityId?: string;
}

export const usersApi = {
  getMe() {
    return apiClient.get<{ success: boolean; data: User }>('/users/me');
  },

  updateMe(payload: UpdateUserPayload) {
    return apiClient.patch<{ success: boolean; data: User }>('/users/me', payload);
  },
};
