import { apiClient } from './client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list(params?: { page?: number; limit?: number }) {
    return apiClient.get<{ success: boolean; data: Notification[]; total: number }>(
      '/notifications',
      { params },
    );
  },

  markAsRead(id: string) {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead() {
    return apiClient.patch('/notifications/read-all');
  },
};
