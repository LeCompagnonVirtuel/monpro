import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, CreateBookingPayload } from '@/api/bookings';

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: async () => {
      const { data } = await bookingsApi.getById(id!);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBookingPayload) => {
      const { data } = await bookingsApi.create(payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}
