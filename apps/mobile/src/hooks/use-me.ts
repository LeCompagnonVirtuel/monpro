import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/stores/auth.store';

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await usersApi.getMe();
      return data.data;
    },
    enabled: isAuthenticated,
  });
}
