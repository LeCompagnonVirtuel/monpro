import { apiClient } from './client';

export type NotificationType =
  | 'NEW_REQUEST' | 'NEW_QUOTE' | 'QUOTE_ACCEPTED'
  | 'BOOKING_CONFIRMED' | 'REMINDER' | 'PROFESSIONAL_ARRIVING'
  | 'INTERVENTION_COMPLETED' | 'NEW_MESSAGE' | 'NEW_PAYMENT' | 'NEW_REVIEW';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationsApi = {
  list(params?: { page?: number; limit?: number }) {
    return apiClient.get<{ success: boolean; data: Notification[]; total: number }>(
      '/notifications',
      { params },
    );
  },

  getUnreadCount() {
    return apiClient.get<{ success: boolean; data: UnreadCountResponse }>('/notifications/unread-count');
  },

  markAsRead(id: string) {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead() {
    return apiClient.patch('/notifications/read-all');
  },
};
