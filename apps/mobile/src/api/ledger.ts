import { apiClient } from './client';

export interface Wallet {
  professionalId: string;
  availableBalance: number;
  totalEarned: number;
  totalPaidOut: number;
  currency: string;
}

export const ledgerApi = {
  getWallet() {
    return apiClient.get<{ success: boolean; data: Wallet }>('/ledger/wallet');
  },
};
