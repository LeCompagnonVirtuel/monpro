import { useQuery } from '@tanstack/react-query';
import { professionalsApi, ProfessionalListParams, ProfessionalMatchParams } from '@/api/professionals';

export function useProfessionals(params?: ProfessionalListParams) {
  return useQuery({
    queryKey: ['professionals', params],
    queryFn: async () => {
      const { data } = await professionalsApi.list(params);
      return { professionals: data.data, total: data.total };
    },
  });
}

export function useProfessional(id: string | undefined) {
  return useQuery({
    queryKey: ['professionals', id],
    queryFn: async () => {
      const { data } = await professionalsApi.getById(id!);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useProfessionalMatch(params: ProfessionalMatchParams | undefined) {
  return useQuery({
    queryKey: ['professionals', 'match', params],
    queryFn: async () => {
      const { data } = await professionalsApi.match(params!);
      return data.data;
    },
    enabled: !!params?.serviceId,
  });
}
