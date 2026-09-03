import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { professionalsApi } from '@/api/professionals';
import { useAuthStore } from '@/stores/auth.store';

export function useMyProfessionalProfile() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: ['professional', 'me'],
    queryFn: async () => {
      try {
        const { data } = await professionalsApi.getMe();
        return data.data;
      } catch (err) {
        if ((err as AxiosError)?.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!userId,
  });
}

export function useCreateProfessionalProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { businessName?: string; description?: string; experienceYears?: number; serviceIds?: string[] }) => {
      const { data } = await professionalsApi.create(payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional', 'me'] });
    },
  });
}

export function useUpdateProfessionalProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; businessName?: string; description?: string; experienceYears?: number; isAvailable?: boolean }) => {
      const { data } = await professionalsApi.update(id, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['pro-dashboard'] });
    },
  });
}
