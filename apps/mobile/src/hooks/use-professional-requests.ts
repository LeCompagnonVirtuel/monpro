import { useQuery } from '@tanstack/react-query';
import { requestsApi, ServiceRequestStatus } from '@/api/requests';
import { AxiosError } from 'axios';

export function useProfessionalRequests(params?: { status?: ServiceRequestStatus; page?: number; limit?: number; enabled?: boolean }) {
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: ['pro-requests', queryParams],
    queryFn: async () => {
      try {
        const { data } = await requestsApi.getAvailable(queryParams);
        return { requests: data.data, total: data.total };
      } catch (err) {
        if (err instanceof AxiosError && err.response?.status === 404) {
          return { requests: [], total: 0 };
        }
        throw err;
      }
    },
    enabled,
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
