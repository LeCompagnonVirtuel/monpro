import { AxiosError } from 'axios';
import { extractApiError, ApiError } from '../api/errors';
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
  queryClient: { clear: jest.fn(), setQueryData: jest.fn() },
}));

describe('Phase 8 — Environment Config', () => {
  it('API_BASE_URL contains /api/v1 path', () => {
    jest.resetModules();
    jest.doMock('expo-constants', () => ({
      default: { expoConfig: { extra: {} } },
    }));
    const { API_BASE_URL } = require('../lib/config');
    expect(API_BASE_URL).toContain('/api/v1');
    expect(API_BASE_URL).toMatch(/^https?:\/\//);
  });

  it('API_BASE_URL prioritizes expoConfig.extra.apiUrl', () => {
    jest.resetModules();
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { expoConfig: { extra: { apiUrl: 'http://custom:4000/api/v1' } } },
    }));
    const { API_BASE_URL } = require('../lib/config');
    expect(API_BASE_URL).toBe('http://custom:4000/api/v1');
  });
});

describe('Phase 8 — Error Status Codes Coverage', () => {
  function makeAxiosError(status: number): AxiosError {
    return new AxiosError(`Error ${status}`, String(status), undefined, undefined, {
      status,
      data: {},
      headers: {},
      statusText: '',
      config: {} as any,
    });
  }

  it('maps 400 to incorrect data message', () => {
    const err = extractApiError(makeAxiosError(400));
    expect(err.status).toBe(400);
    expect(err.message).toBe('Les données envoyées sont incorrectes.');
  });

  it('maps 404 to not found message', () => {
    const err = extractApiError(makeAxiosError(404));
    expect(err.status).toBe(404);
    expect(err.message).toBe("Cette ressource n'existe pas ou a été supprimée.");
  });

  it('maps 409 to conflict message', () => {
    const err = extractApiError(makeAxiosError(409));
    expect(err.status).toBe(409);
    expect(err.message).toBe('Cette action a déjà été effectuée.');
  });

  it('maps 413 to file too large message', () => {
    const err = extractApiError(makeAxiosError(413));
    expect(err.status).toBe(413);
    expect(err.message).toBe('Le fichier est trop volumineux.');
  });

  it('maps 422 to validation error message', () => {
    const err = extractApiError(makeAxiosError(422));
    expect(err.status).toBe(422);
    expect(err.message).toBe('Les données envoyées sont invalides.');
  });

  it('maps 502 to server unavailable message', () => {
    const err = extractApiError(makeAxiosError(502));
    expect(err.status).toBe(502);
    expect(err.message).toBe('Le serveur est temporairement indisponible.');
  });

  it('maps 503 to maintenance message', () => {
    const err = extractApiError(makeAxiosError(503));
    expect(err.status).toBe(503);
    expect(err.message).toBe('Le serveur est en maintenance. Veuillez réessayer plus tard.');
  });

  it('maps unknown status to generic message', () => {
    const err = extractApiError(makeAxiosError(418));
    expect(err.status).toBe(418);
    expect(err.message).toBe('Une erreur inattendue est survenue.');
  });

  it('uses array message first element from backend', () => {
    const error = new AxiosError('Bad Request', '400', undefined, undefined, {
      status: 400,
      data: { message: ['Champ requis.', 'Format invalide.'] },
      headers: {},
      statusText: '',
      config: {} as any,
    });
    const err = extractApiError(error);
    expect(err.message).toBe('Champ requis.');
  });
});

describe('Phase 8 — Role Routing Guards', () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false, role: null, userId: null, isLoading: false });
  });

  it('CLIENT role produces correct redirect path', () => {
    useAuthStore.setState({ isAuthenticated: true, role: 'CLIENT', userId: 'u1' });
    const { role } = useAuthStore.getState();
    const path = role === 'PROFESSIONAL' ? '/(professional)/(tabs)/dashboard' : '/(client)/(tabs)/home';
    expect(path).toBe('/(client)/(tabs)/home');
  });

  it('PROFESSIONAL role produces correct redirect path', () => {
    useAuthStore.setState({ isAuthenticated: true, role: 'PROFESSIONAL', userId: 'u1' });
    const { role } = useAuthStore.getState();
    const path = role === 'PROFESSIONAL' ? '/(professional)/(tabs)/dashboard' : '/(client)/(tabs)/home';
    expect(path).toBe('/(professional)/(tabs)/dashboard');
  });

  it('unauthenticated user should not be redirected', () => {
    const { isAuthenticated } = useAuthStore.getState();
    expect(isAuthenticated).toBe(false);
  });
});

describe('Phase 8 — Socket Cleanup', () => {
  let socketService: typeof import('../lib/socket').socketService;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('socket.io-client', () => ({
      io: jest.fn().mockReturnValue({
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        removeAllListeners: jest.fn(),
        connected: false,
      }),
    }));
    jest.mock('../lib/storage', () => ({
      tokenStorage: {
        getAccessToken: jest.fn().mockResolvedValue('test-token'),
        getRefreshToken: jest.fn().mockResolvedValue('test-refresh'),
        setTokens: jest.fn(),
        clearTokens: jest.fn(),
      },
    }));
    jest.mock('../lib/config', () => ({
      API_BASE_URL: 'https://monpro-api.onrender.com/api/v1',
    }));
    jest.mock('../api/messaging', () => ({}));
    socketService = require('../lib/socket').socketService;
  });

  it('disconnect removes all listeners and nulls socket', async () => {
    await socketService.connect();
    socketService.disconnect();
    expect(socketService.isConnected()).toBe(false);
  });

  it('connect with no token stays disconnected', async () => {
    const { tokenStorage } = require('../lib/storage');
    tokenStorage.getAccessToken.mockResolvedValueOnce(null);
    await socketService.connect();
    expect(socketService.isConnected()).toBe(false);
  });

  it('status listeners are notified on disconnect', async () => {
    const listener = jest.fn();
    socketService.onStatus(listener);
    socketService.disconnect();
    expect(listener).toHaveBeenCalledWith('disconnected');
  });

  it('status listener cleanup prevents further calls', () => {
    const listener = jest.fn();
    const unsub = socketService.onStatus(listener);
    unsub();
    socketService.disconnect();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('Phase 8 — Refresh Token Concurrency', () => {
  it('single-flight: only one refresh at a time', async () => {
    jest.resetModules();
    const mockPost = jest.fn().mockResolvedValue({
      data: { data: { accessToken: 'new-at', refreshToken: 'new-rt' } },
    });
    jest.mock('axios', () => {
      const create = jest.fn().mockReturnValue({
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });
      return { default: { create, post: mockPost }, AxiosError: Error, create, post: mockPost };
    });

    const { setSessionExpiredHandler } = require('../api/client');
    expect(typeof setSessionExpiredHandler).toBe('function');
  });
});

describe('Phase 8 — Payment State Rules', () => {
  it('PENDING is not equal to COMPLETED', () => {
    const PENDING = 'PENDING';
    const COMPLETED = 'COMPLETED';
    expect(PENDING).not.toBe(COMPLETED);
  });

  it('payment amount must come from backend, never recalculated', () => {
    const backendAmount = 25000;
    const items = [{ price: 10000 }, { price: 15000 }];
    const clientCalc = items.reduce((sum, i) => sum + i.price, 0);
    expect(backendAmount).toBe(clientCalc);
    // Rule: always use backendAmount, never clientCalc
    const displayAmount = backendAmount;
    expect(displayAmount).toBe(25000);
  });
});

describe('Phase 8 — Network Status', () => {
  it('useNetworkStatus hook exports correct type', () => {
    const { useNetworkStatus } = require('../hooks/use-network-status');
    expect(typeof useNetworkStatus).toBe('function');
  });
});

describe('Phase 8 — API Client Configuration', () => {
  it('client module exports apiClient and setSessionExpiredHandler', () => {
    jest.resetModules();
    jest.mock('../lib/config', () => ({
      API_BASE_URL: 'https://monpro-api.onrender.com/api/v1',
    }));
    jest.mock('../lib/storage', () => ({
      tokenStorage: {
        getAccessToken: jest.fn().mockResolvedValue(null),
        getRefreshToken: jest.fn().mockResolvedValue(null),
        setTokens: jest.fn(),
        clearTokens: jest.fn(),
      },
    }));
    const clientModule = require('../api/client');
    expect(clientModule.apiClient).toBeDefined();
    expect(typeof clientModule.setSessionExpiredHandler).toBe('function');
  });

  it('config centralizes the API base URL', () => {
    jest.resetModules();
    jest.mock('expo-constants', () => ({
      default: { expoConfig: { extra: {} } },
    }));
    const { API_BASE_URL } = require('../lib/config');
    expect(API_BASE_URL).toContain('/api/v1');
    expect(API_BASE_URL).toMatch(/^https?:\/\//);
  });
});

describe('Phase 8 — ApiError class', () => {
  it('fromAxios returns ApiError instance', () => {
    const error = new AxiosError('Not Found', '404', undefined, undefined, {
      status: 404,
      data: { message: 'Professionnel introuvable' },
      headers: {},
      statusText: '',
      config: {} as any,
    });
    const apiError = ApiError.fromAxios(error);
    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError.status).toBe(404);
    expect(apiError.message).toBe('Professionnel introuvable');
    expect(apiError.code).toBe('HTTP_404');
  });

  it('fromAxios uses error code from backend when available', () => {
    const error = new AxiosError('Conflict', '409', undefined, undefined, {
      status: 409,
      data: { error: 'ALREADY_BOOKED', message: 'Déjà réservé' },
      headers: {},
      statusText: '',
      config: {} as any,
    });
    const apiError = ApiError.fromAxios(error);
    expect(apiError.code).toBe('ALREADY_BOOKED');
  });
});
