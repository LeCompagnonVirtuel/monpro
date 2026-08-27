import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/categories';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await categoriesApi.list();
      return data.data;
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: async () => {
      const { data } = await categoriesApi.getById(id!);
      return data.data;
    },
    enabled: !!id,
  });
}
