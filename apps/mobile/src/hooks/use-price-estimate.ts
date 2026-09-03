import { useQuery } from '@tanstack/react-query';
import { aiApi, PriceEstimate } from '@/api/ai';

export function usePriceEstimate(
  serviceId: string | null,
  description: string,
  latitude?: number,
  longitude?: number,
) {
  return useQuery<PriceEstimate>({
    queryKey: ['price-estimate', serviceId, description, latitude, longitude],
    queryFn: async () => {
      if (!serviceId) throw new Error('No service ID');
      const { data: res } = await aiApi.estimatePrice(serviceId, description, latitude, longitude);
      return res.data;
    },
    enabled: !!serviceId && description.trim().length >= 10,
    staleTime: 3600_000,
    gcTime: 3600_000,
    retry: 1,
  });
}
