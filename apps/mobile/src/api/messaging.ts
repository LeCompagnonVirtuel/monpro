import { apiClient } from './client';

export interface Conversation {
  id: string;
  participants: { id: string; fullName: string; avatarUrl?: string }[];
  lastMessage?: { content: string; createdAt: string };
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export const messagingApi = {
  listConversations() {
    return apiClient.get<{ success: boolean; data: Conversation[] }>('/conversations');
  },

  createConversation(recipientId: string) {
    return apiClient.post<{ success: boolean; data: Conversation }>('/conversations', { recipientId });
  },

  getMessages(conversationId: string, params?: { page?: number; limit?: number }) {
    return apiClient.get<{ success: boolean; data: Message[]; total: number }>(
      `/conversations/${conversationId}/messages`,
      { params },
    );
  },

  sendMessage(conversationId: string, content: string, imageUrl?: string) {
    return apiClient.post<{ success: boolean; data: Message }>(
      `/conversations/${conversationId}/messages`,
      { content, imageUrl },
    );
  },

  markAsRead(conversationId: string) {
    return apiClient.post(`/conversations/${conversationId}/read`);
  },
};
