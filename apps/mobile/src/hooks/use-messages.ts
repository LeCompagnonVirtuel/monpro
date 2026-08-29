import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingApi } from '@/api/messaging';

const PAGE_SIZE = 30;

export function useMessages(conversationId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam }) => {
      const { data } = await messagingApi.getMessages(conversationId!, {
        page: pageParam,
        limit: PAGE_SIZE,
      });
      return { messages: data.data, total: data.total };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.messages.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled: !!conversationId,
    select: (data) => {
      const all = data.pages.flatMap((p) => p.messages);
      const unique = Array.from(new Map(all.map((m) => [m.id, m])).values());
      return unique.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { conversationId: string; content: string; imageUrl?: string }) => {
      const { data } = await messagingApi.sendMessage(params.conversationId, params.content, params.imageUrl);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
