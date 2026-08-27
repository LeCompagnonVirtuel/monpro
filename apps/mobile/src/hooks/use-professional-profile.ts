import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { professionalsApi, Professional } from '@/api/professionals';
import { useAuthStore } from '@/stores/auth.store';

export function useMyProfessionalProfile() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: ['professional', 'me', userId],
    queryFn: async () => {
      const { data } = await professionalsApi.list({ limit: 100 });
      const mine = data.data.find((p: Professional) => p.userId === userId);
      return mine || null;
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
      queryClient.invalidateQueries({ queryKey: ['professional'] });
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
      queryClient.invalidateQueries({ queryKey: ['professional'] });
      queryClient.invalidateQueries({ queryKey: ['pro-dashboard'] });
    },
  });
}
