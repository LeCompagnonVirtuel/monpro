import { useAuthStore } from '../stores/auth.store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../api/auth', () => ({
  authApi: { logout: jest.fn().mockResolvedValue({}) },
}));

jest.mock('../api/users', () => ({
  usersApi: { getMe: jest.fn() },
}));

jest.mock('../lib/query-client', () => ({
  queryClient: { clear: jest.fn() },
}));

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      userId: null,
      role: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.userId).toBeNull();
    expect(state.role).toBeNull();
  });

  it('login stores tokens and sets auth state', async () => {
    const { setItemAsync } = require('expo-secure-store');
    await useAuthStore.getState().login('user-1', 'CLIENT', 'access123', 'refresh456');
    expect(setItemAsync).toHaveBeenCalledWith('monpro_access_token', 'access123');
    expect(setItemAsync).toHaveBeenCalledWith('monpro_refresh_token', 'refresh456');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.userId).toBe('user-1');
    expect(state.role).toBe('CLIENT');
  });

  it('logout clears state and tokens', async () => {
    const { deleteItemAsync } = require('expo-secure-store');
    useAuthStore.setState({ userId: 'user-1', role: 'CLIENT', isAuthenticated: true });
    await useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.userId).toBeNull();
    expect(state.role).toBeNull();
    expect(deleteItemAsync).toHaveBeenCalled();
  });

  it('restoreSession sets loading false when no token', async () => {
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('restoreSession authenticates with valid token', async () => {
    const { getItemAsync } = require('expo-secure-store');
    const { usersApi } = require('../api/users');
    getItemAsync.mockResolvedValueOnce('valid-token');
    usersApi.getMe.mockResolvedValueOnce({
      data: { data: { id: 'u1', phone: '+225070000', fullName: 'Aya', role: 'PROFESSIONAL', isActive: true } },
    });

    await useAuthStore.getState().restoreSession();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.role).toBe('PROFESSIONAL');
    expect(state.userId).toBe('u1');
    expect(state.isLoading).toBe(false);
  });

  it('restoreSession clears session for suspended user', async () => {
    const { getItemAsync, deleteItemAsync } = require('expo-secure-store');
    const { usersApi } = require('../api/users');
    getItemAsync.mockResolvedValueOnce('valid-token');
    usersApi.getMe.mockResolvedValueOnce({
      data: { data: { id: 'u1', phone: '+225070000', fullName: 'Aya', role: 'CLIENT', isActive: false } },
    });

    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(deleteItemAsync).toHaveBeenCalled();
  });

  it('restoreSession clears on API error (expired token)', async () => {
    const { getItemAsync, deleteItemAsync } = require('expo-secure-store');
    const { usersApi } = require('../api/users');
    getItemAsync.mockResolvedValueOnce('expired-token');
    usersApi.getMe.mockRejectedValueOnce(new Error('401'));

    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(deleteItemAsync).toHaveBeenCalled();
  });
});
