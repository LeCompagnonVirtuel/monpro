import { apiClient } from './client';

export interface User {
  id: string;
  phone: string;
  fullName: string;
  role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
  avatarUrl?: string;
  cityId?: string;
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
