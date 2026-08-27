import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '@/api/requests';

export function useProfessionalRequests(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['pro-requests', params],
    queryFn: async () => {
      const { data } = await requestsApi.getAvailable(params);
      return { requests: data.data, total: data.total };
    },
  });
}

export function useProfessionalRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['pro-request', id],
    queryFn: async () => {
      const { data } = await requestsApi.getById(id!);
      return data.data;
    },
    enabled: !!id,
  });
}
