import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi, CreateServiceRequestPayload, ServiceRequestStatus } from '@/api/requests';

export function useServiceRequests(params?: { status?: ServiceRequestStatus; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['service-requests', params],
    queryFn: async () => {
      const { data } = await requestsApi.listMine(params);
      return { requests: data.data, total: data.total };
    },
  });
}

export function useServiceRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['service-requests', id],
    queryFn: async () => {
      const { data } = await requestsApi.getById(id!);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateServiceRequestPayload) => {
      const { data } = await requestsApi.create(payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    },
  });
}
