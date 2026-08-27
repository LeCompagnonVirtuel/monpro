import { useQuery } from '@tanstack/react-query';
import { ledgerApi } from '@/api/ledger';

export function useProfessionalWallet() {
  return useQuery({
    queryKey: ['pro-revenue', 'wallet'],
    queryFn: async () => {
      const { data } = await ledgerApi.getWallet();
      return data.data;
    },
  });
}
