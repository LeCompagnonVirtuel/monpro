import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '@/lib/socket';
import { RealtimeEvent } from '@/types/realtime';

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = socketService.onRealtimeEvent((event: RealtimeEvent) => {
      switch (event.type) {
        case 'notification.created':
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
          break;

        case 'quote.created':
          if (event.metadata?.serviceRequestId) {
            queryClient.invalidateQueries({
              queryKey: ['quotes', 'request', event.metadata.serviceRequestId],
            });
            queryClient.invalidateQueries({
              queryKey: ['service-requests'],
            });
          }
          break;

        case 'quote.accepted':
          if (event.metadata?.serviceRequestId) {
            queryClient.invalidateQueries({
              queryKey: ['quotes', 'request', event.metadata.serviceRequestId],
            });
            queryClient.invalidateQueries({
              queryKey: ['service-requests'],
            });
            queryClient.invalidateQueries({ queryKey: ['pro-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['pro-quotes'] });
          }
          break;

        case 'quote.rejected':
          if (event.metadata?.serviceRequestId) {
            queryClient.invalidateQueries({
              queryKey: ['quotes', 'request', event.metadata.serviceRequestId],
            });
            queryClient.invalidateQueries({ queryKey: ['pro-quotes'] });
          }
          break;

        case 'booking.created':
          queryClient.invalidateQueries({ queryKey: ['pro-bookings'] });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['service-requests'] });
          break;

        case 'booking.status_changed':
          if (event.entityId) {
            queryClient.invalidateQueries({ queryKey: ['bookings', event.entityId] });
            queryClient.invalidateQueries({ queryKey: ['pro-booking', event.entityId] });
          }
          queryClient.invalidateQueries({ queryKey: ['pro-bookings'] });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          break;

        case 'intervention.updated':
          if (event.metadata?.bookingId) {
            queryClient.invalidateQueries({
              queryKey: ['interventions', event.metadata.bookingId],
            });
            queryClient.invalidateQueries({
              queryKey: ['pro-intervention', event.metadata.bookingId],
            });
          }
          break;

        case 'intervention.confirmed':
          if (event.metadata?.bookingId) {
            queryClient.invalidateQueries({
              queryKey: ['interventions', event.metadata.bookingId],
            });
            queryClient.invalidateQueries({
              queryKey: ['pro-intervention', event.metadata.bookingId],
            });
            queryClient.invalidateQueries({ queryKey: ['pro-revenue'] });
          }
          break;

        case 'payment.updated':
          if (event.metadata?.bookingId) {
            queryClient.invalidateQueries({
              queryKey: ['payments', event.metadata.bookingId],
            });
            queryClient.invalidateQueries({
              queryKey: ['bookings', event.metadata.bookingId],
            });
          }
          queryClient.invalidateQueries({ queryKey: ['pro-revenue'] });
          break;
      }
    });

    return () => unsubscribe();
  }, [queryClient]);
}
