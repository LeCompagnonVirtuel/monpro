import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interventionsApi } from '@/api/interventions';

export function useProfessionalIntervention(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['pro-intervention', bookingId],
    queryFn: async () => {
      const { data } = await interventionsApi.getByBooking(bookingId!);
      return data.data;
    },
    enabled: !!bookingId,
  });
}

export function useCreateIntervention() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await interventionsApi.create(bookingId);
      return data.data;
    },
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['pro-intervention', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['pro-bookings'] });
    },
  });
}

export function useMarkArrived() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      await interventionsApi.markArrived(bookingId);
    },
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['pro-intervention', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['pro-bookings'] });
    },
  });
}

export function useStartIntervention() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, beforePhotos }: { bookingId: string; beforePhotos: string[] }) => {
      await interventionsApi.start(bookingId, beforePhotos);
    },
    onSuccess: (_data, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['pro-intervention', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['pro-bookings'] });
    },
  });
}

export function useCompleteIntervention() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, afterPhotos, completionNotes }: { bookingId: string; afterPhotos: string[]; completionNotes?: string }) => {
      await interventionsApi.complete(bookingId, afterPhotos, completionNotes);
    },
    onSuccess: (_data, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['pro-intervention', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['pro-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['pro-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pro-revenue'] });
    },
  });
}
