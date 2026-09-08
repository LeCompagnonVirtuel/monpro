import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, CreateReviewPayload } from '@/api/reviews';
import { bookingsApi } from '@/api/bookings';

export function useHasReviewed(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['review-submitted', bookingId],
    queryFn: async () => {
      if (!bookingId) return false;
      try {
        const { data } = await bookingsApi.getById(bookingId);
        return !!(data.data as any)?.review;
      } catch {
        return false;
      }
    },
    enabled: !!bookingId,
    staleTime: 5 * 60 * 1000,
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
