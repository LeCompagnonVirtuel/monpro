import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '@/api/favorites';
import { useAuthStore } from '@/stores/auth.store';

export function useFavorites() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data } = await favoritesApi.list();
      return data.data;
    },
    enabled: isAuthenticated,
  });
}

export function useIsFavorite(professionalId: string | undefined) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['favorites', 'check', professionalId],
    queryFn: async () => {
      const { data } = await favoritesApi.check(professionalId!);
      return data.data.isFavorite;
    },
    enabled: isAuthenticated && !!professionalId,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (professionalId: string) => favoritesApi.add(professionalId),
    onSuccess: (_data, professionalId) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.setQueryData(['favorites', 'check', professionalId], true);
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (professionalId: string) => favoritesApi.remove(professionalId),
    onSuccess: (_data, professionalId) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.setQueryData(['favorites', 'check', professionalId], false);
    },
  });
}
