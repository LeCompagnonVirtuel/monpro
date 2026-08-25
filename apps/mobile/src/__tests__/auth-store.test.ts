import { useAuthStore } from '../stores/auth.store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('setUser authenticates when user provided', () => {
    const mockUser = {
      id: '1',
      phone: '+2250700000001',
      fullName: 'Test',
      role: 'CLIENT' as const,
      isActive: true,
      createdAt: '2024-01-01',
    };
    useAuthStore.getState().setUser(mockUser);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
  });

  it('setUser de-authenticates with null', () => {
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('logout clears state', async () => {
    const { deleteItemAsync } = require('expo-secure-store');
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(deleteItemAsync).toHaveBeenCalled();
  });

  it('login stores tokens in SecureStore', async () => {
    const { setItemAsync } = require('expo-secure-store');
    const mockUser = {
      id: '1',
      phone: '+2250700000001',
      fullName: 'Test',
      role: 'CLIENT' as const,
      isActive: true,
      createdAt: '2024-01-01',
    };
    await useAuthStore.getState().login(mockUser, 'access123', 'refresh456');
    expect(setItemAsync).toHaveBeenCalledWith('monpro_access_token', 'access123');
    expect(setItemAsync).toHaveBeenCalledWith('monpro_refresh_token', 'refresh456');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
