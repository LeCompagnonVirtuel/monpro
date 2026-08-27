import { apiClient } from './client';

export interface Wallet {
  balance: number;
  totalEarned: number;
  totalCommission: number;
  currency: string;
}

export const ledgerApi = {
  getWallet() {
    return apiClient.get<{ success: boolean; data: Wallet }>('/ledger/wallet');
  },
};
