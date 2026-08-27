import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, CreateReviewPayload } from '@/api/reviews';

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateReviewPayload) => {
      const { data } = await reviewsApi.create(payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
    },
  });
}
