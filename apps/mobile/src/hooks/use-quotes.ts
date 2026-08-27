import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesApi, Quote } from '@/api/quotes';

export function useQuotesForRequest(requestId: string | undefined) {
  return useQuery({
    queryKey: ['quotes', 'request', requestId],
    queryFn: async () => {
      const { data } = await quotesApi.listForRequest(requestId!);
      return data.data;
    },
    enabled: !!requestId,
  });
}

export function useAcceptQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { data } = await quotesApi.accept(quoteId);
      return data.data;
    },
    onSuccess: (quote: Quote) => {
      queryClient.invalidateQueries({ queryKey: ['quotes', 'request', quote.serviceRequestId] });
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    },
  });
}

export function useRejectQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { data } = await quotesApi.reject(quoteId);
      return data.data;
    },
    onSuccess: (quote: Quote) => {
      queryClient.invalidateQueries({ queryKey: ['quotes', 'request', quote.serviceRequestId] });
    },
  });
}
