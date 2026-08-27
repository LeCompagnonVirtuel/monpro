import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingApi } from '@/api/messaging';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await messagingApi.listConversations();
      return data.data;
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipientId: string) => {
      const { data } = await messagingApi.createConversation(recipientId);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      await messagingApi.markAsRead(conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
