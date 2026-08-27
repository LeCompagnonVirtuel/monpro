import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '@/api/reviews';

export function useReviews(professionalId: string | undefined, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['reviews', professionalId, params],
    queryFn: async () => {
      const { data } = await reviewsApi.listByProfessional(professionalId!, params);
      return { reviews: data.data, total: data.total };
    },
    enabled: !!professionalId,
  });
}
