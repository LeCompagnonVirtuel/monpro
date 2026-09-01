import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { professionalServicesApi, UpdateProfessionalServicePayload } from '@/api/professional-services';

export function useProfessionalServices(professionalId: string | undefined) {
  return useQuery({
    queryKey: ['professional-services', professionalId],
    queryFn: async () => {
      const { data } = await professionalServicesApi.list(professionalId!);
      return data.data;
    },
    enabled: !!professionalId,
  });
}

export function useAddProfessionalService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ professionalId, serviceId, payload }: { professionalId: string; serviceId: string; payload?: UpdateProfessionalServicePayload }) => {
      const { data } = await professionalServicesApi.add(professionalId, serviceId, payload);
      return data.data;
    },
    onSuccess: (_data, { professionalId }) => {
      queryClient.invalidateQueries({ queryKey: ['professional-services', professionalId] });
    },
  });
}

export function useUpdateProfessionalService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ professionalId, serviceId, payload }: { professionalId: string; serviceId: string; payload: UpdateProfessionalServicePayload }) => {
      const { data } = await professionalServicesApi.update(professionalId, serviceId, payload);
      return data.data;
    },
    onSuccess: (_data, { professionalId }) => {
      queryClient.invalidateQueries({ queryKey: ['professional-services', professionalId] });
    },
  });
}

export function useRemoveProfessionalService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ professionalId, serviceId }: { professionalId: string; serviceId: string }) => {
      await professionalServicesApi.remove(professionalId, serviceId);
    },
    onSuccess: (_data, { professionalId }) => {
      queryClient.invalidateQueries({ queryKey: ['professional-services', professionalId] });
    },
  });
}
