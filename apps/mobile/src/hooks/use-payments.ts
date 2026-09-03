import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, InitiatePaymentPayload } from '@/api/payments';

export function usePaymentForBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['payments', bookingId],
    queryFn: async () => {
      const { data } = await paymentsApi.getByBooking(bookingId!);
      return data.data;
    },
    enabled: !!bookingId,
  });
}

export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InitiatePaymentPayload) => {
      const { data } = await paymentsApi.initiate(payload);
      return data.data;
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ['payments', payment.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const { data } = await paymentsApi.refund(paymentId, reason);
      return data.data;
    },
    onSuccess: (_result, { paymentId: _paymentId }) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
