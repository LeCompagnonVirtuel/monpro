import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '@/api/requests';
import { AxiosError } from 'axios';

export function useProfessionalRequests(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['pro-requests', params],
    queryFn: async () => {
      try {
        const { data } = await requestsApi.getAvailable(params);
        return { requests: data.data, total: data.total };
      } catch (err) {
        if (err instanceof AxiosError && err.response?.status === 404) {
          return { requests: [], total: 0 };
        }
        throw err;
      }
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
