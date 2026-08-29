import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, UpdateUserPayload } from '@/api/users';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateUserPayload) => {
      const { data } = await usersApi.updateMe(payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
