import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, BookingStatus } from '@/api/bookings';
import { AxiosError } from 'axios';

export function useProfessionalBookings(professionalId: string | undefined, params?: { status?: BookingStatus; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['pro-bookings', professionalId, params],
    queryFn: async () => {
      try {
        const { data } = await bookingsApi.listByProfessional(professionalId!, params);
        return { bookings: data.data, total: data.total };
      } catch (err) {
        if (err instanceof AxiosError && (err.response?.status === 404 || err.response?.status === 403)) {
          return { bookings: [], total: 0 };
        }
        throw err;
      }
    },
    enabled: !!professionalId,
  });
}

export function useProfessionalBooking(id: string | undefined) {
  return useQuery({
    queryKey: ['pro-booking', id],
    queryFn: async () => {
      const { data } = await bookingsApi.getById(id!);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      await bookingsApi.updateStatus(id, status);
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['pro-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['pro-booking', id] });
      queryClient.invalidateQueries({ queryKey: ['pro-dashboard'] });
    },
  });
}
