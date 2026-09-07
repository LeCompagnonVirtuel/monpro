import { useQuery } from '@tanstack/react-query';
import { professionalsApi, ProfessionalListParams, ProfessionalMatchParams, Professional } from '@/api/professionals';

function isDemo(pro: Professional): boolean {
  const name = (pro.user?.fullName || pro.businessName || '').toUpperCase();
  return name.includes('[DEMO]') || name.includes('[TEST]');
}

export function useProfessionals(params?: ProfessionalListParams) {
  return useQuery({
    queryKey: ['professionals', params],
    queryFn: async () => {
      const { data } = await professionalsApi.list(params);
      const professionals = (data.data || []).filter((p) => !isDemo(p));
      return { professionals, total: professionals.length };
    },
  });
}

export function useProfessional(id: string | undefined) {
  return useQuery({
    queryKey: ['professionals', id],
    queryFn: async () => {
      const { data } = await professionalsApi.getById(id!);
      const pro = data.data;
      if (pro && isDemo(pro)) return null;
      return pro;
    },
    enabled: !!id,
  });
}

export function useProfessionalMatch(params: ProfessionalMatchParams | undefined) {
  return useQuery({
    queryKey: ['professionals', 'match', params],
    queryFn: async () => {
      const { data } = await professionalsApi.match(params!);
      return (data.data || []).filter((p) => !isDemo(p));
    },
    enabled: !!params?.serviceId,
  });
}
