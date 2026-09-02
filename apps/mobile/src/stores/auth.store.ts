import { create } from 'zustand';
import { tokenStorage } from '@/lib/storage';
import { authApi } from '@/api/auth';
import { usersApi } from '@/api/users';
import { apiClient } from '@/api/client';
import { queryClient } from '@/lib/query-client';

type Role = 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role | null;
  userId: string | null;
  login: (userId: string, role: Role, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  role: null,
  userId: null,

  login: async (userId, role, accessToken, refreshToken) => {
    await tokenStorage.setTokens(accessToken, refreshToken);
    queryClient.clear();
    set({ userId, role, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      const pushToken = await tokenStorage.getPushToken();
      if (pushToken) {
        await apiClient.delete(`/device-tokens/${encodeURIComponent(pushToken)}`).catch(() => {});
        await tokenStorage.clearPushToken();
      }
      await authApi.logout();
    } catch {
      // Network failure shouldn't block local cleanup
    }
    await tokenStorage.clearTokens();
    queryClient.clear();
    set({ userId: null, role: null, isAuthenticated: false, isLoading: false });
  },

  restoreSession: async () => {
    const token = await tokenStorage.getAccessToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const { data } = await usersApi.getMe();
      const user = data.data;

      if (!user.isActive) {
        await tokenStorage.clearTokens();
        set({ isLoading: false });
        return;
      }

      set({
        userId: user.id,
        role: user.role,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      await tokenStorage.clearTokens();
      set({ isLoading: false });
    }
  },
}));
