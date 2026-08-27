import { useQuery } from '@tanstack/react-query';
import { servicesApi, ServiceSearchParams } from '@/api/services';

export function useServices(params?: ServiceSearchParams) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: async () => {
      const { data } = await servicesApi.list(params);
      return data.data;
    },
    enabled: !params?.categoryId || !!params.categoryId,
  });
}

export function useServiceSearch(query: string) {
  return useQuery({
    queryKey: ['services', 'search', query],
    queryFn: async () => {
      const { data } = await servicesApi.search(query);
      return data.data;
    },
    enabled: query.length >= 2,
  });
}

export function useService(id: string | undefined) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: async () => {
      const { data } = await servicesApi.getById(id!);
      return data.data;
    },
    enabled: !!id,
  });
}
