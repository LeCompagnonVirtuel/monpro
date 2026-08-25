import { create } from 'zustand';
import { tokenStorage } from '@/lib/storage';
import { User } from '@/api/users';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setLoading: (isLoading) => set({ isLoading }),

  login: async (user, accessToken, refreshToken) => {
    await tokenStorage.setTokens(accessToken, refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await tokenStorage.clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  restoreSession: async () => {
    const token = await tokenStorage.getAccessToken();
    if (!token) {
      set({ isLoading: false });
      return false;
    }
    return true;
  },
}));
