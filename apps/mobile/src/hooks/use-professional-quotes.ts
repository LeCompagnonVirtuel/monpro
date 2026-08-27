import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesApi, CreateQuotePayload, Quote } from '@/api/quotes';

export function useProfessionalQuotes(professionalId: string | undefined, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['pro-quotes', professionalId, params],
    queryFn: async () => {
      const { data } = await quotesApi.listByProfessional(professionalId!, params);
      return { quotes: data.data, total: data.total };
    },
    enabled: !!professionalId,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateQuotePayload) => {
      const { data } = await quotesApi.create(payload);
      return data.data;
    },
    onSuccess: (quote: Quote) => {
      queryClient.invalidateQueries({ queryKey: ['pro-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['pro-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pro-request', quote.serviceRequestId] });
      queryClient.invalidateQueries({ queryKey: ['pro-dashboard'] });
    },
  });
}
