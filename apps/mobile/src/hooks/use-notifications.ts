import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications';

export function useNotifications(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const { data } = await notificationsApi.list(params);
      return { notifications: data.data, total: data.total };
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await notificationsApi.list({ limit: 50 });
      return data.data.filter((n) => !n.isRead).length;
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await notificationsApi.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await notificationsApi.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
