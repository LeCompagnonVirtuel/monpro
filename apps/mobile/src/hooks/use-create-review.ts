import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, CreateReviewPayload } from '@/api/reviews';

export function useHasReviewed(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['review-submitted', bookingId],
    queryFn: () => false,
    enabled: !!bookingId,
    staleTime: Infinity,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateReviewPayload) => {
      const { data } = await reviewsApi.create(payload);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(['review-submitted', variables.bookingId], true);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
    },
  });
}
