import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '@/api/reviews';

export function useProfessionalReviews(professionalId: string | undefined, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['pro-reviews', professionalId, params],
    queryFn: async () => {
      const { data } = await reviewsApi.listByProfessional(professionalId!, params);
      return { reviews: data.data, total: data.total };
    },
    enabled: !!professionalId,
  });
}

export function useRespondToReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      await reviewsApi.respond(id, response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro-reviews'] });
    },
  });
}
