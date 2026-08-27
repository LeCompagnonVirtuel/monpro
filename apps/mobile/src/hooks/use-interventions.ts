import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interventionsApi } from '@/api/interventions';

export function useIntervention(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['interventions', bookingId],
    queryFn: async () => {
      const { data } = await interventionsApi.getByBooking(bookingId!);
      return data.data;
    },
    enabled: !!bookingId,
  });
}

export function useConfirmIntervention() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      await interventionsApi.confirm(bookingId);
    },
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['interventions', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
