import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { professionalsApi } from '@/api/professionals';

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export function useProfessionalAvailability(professionalId: string | undefined) {
  return useQuery({
    queryKey: ['pro-availability', professionalId],
    queryFn: async () => {
      const { data } = await professionalsApi.getAvailability(professionalId!);
      return (data as { success: boolean; data: AvailabilitySlot[] }).data;
    },
    enabled: !!professionalId,
  });
}

export function useSetAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ professionalId, slots }: { professionalId: string; slots: AvailabilitySlot[] }) => {
      await professionalsApi.setAvailability(professionalId, slots);
    },
    onSuccess: (_data, { professionalId }) => {
      queryClient.invalidateQueries({ queryKey: ['pro-availability', professionalId] });
      queryClient.invalidateQueries({ queryKey: ['professional'] });
    },
  });
}
