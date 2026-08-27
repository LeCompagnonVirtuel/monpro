import { setSessionExpiredHandler } from '../api/client';
import { useAuthStore } from '../stores/auth.store';
import { extractApiError } from '../api/errors';
import { AxiosError } from 'axios';

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

describe('Auth Flow - Phone Validation', () => {
  it('accepts valid CI phone number +225XXXXXXXXXX', () => {
    const validPhones = ['+2250700000001', '+2250100000000', '+2250500000000'];
    const regex = /^\+\d{10,15}$/;
    validPhones.forEach((phone) => {
      expect(regex.test(phone)).toBe(true);
    });
  });

  it('rejects invalid phone numbers', () => {
    const invalidPhones = ['0700000001', '+225', '+2250', '225070000'];
    const regex = /^\+\d{10,15}$/;
    invalidPhones.forEach((phone) => {
      expect(regex.test(phone)).toBe(false);
    });
  });
});

describe('Auth Flow - OTP', () => {
  it('OTP code must be exactly 6 digits', () => {
    const validCode = '123456';
    const invalidCodes = ['12345', '1234567', 'abcdef', '12345a', ''];
    expect(/^\d{6}$/.test(validCode)).toBe(true);
    invalidCodes.forEach((code) => {
      expect(/^\d{6}$/.test(code)).toBe(false);
    });
  });
});

describe('Auth Flow - Error Mapping', () => {
  it('maps 401 to session expired message', () => {
    const error = new AxiosError('Unauthorized', '401', undefined, undefined, {
      status: 401,
      data: {},
      headers: {},
      statusText: 'Unauthorized',
      config: {} as any,
    });
    const apiError = extractApiError(error);
    expect(apiError.status).toBe(401);
    expect(apiError.message).toBe('Votre session a expiré.');
  });

  it('maps 429 to rate limit message', () => {
    const error = new AxiosError('Too Many Requests', '429', undefined, undefined, {
      status: 429,
      data: {},
      headers: {},
      statusText: 'Too Many Requests',
      config: {} as any,
    });
    const apiError = extractApiError(error);
    expect(apiError.message).toBe('Trop de tentatives. Veuillez patienter avant de réessayer.');
  });

  it('maps 403 to forbidden message', () => {
    const error = new AxiosError('Forbidden', '403', undefined, undefined, {
      status: 403,
      data: {},
      headers: {},
      statusText: 'Forbidden',
      config: {} as any,
    });
    const apiError = extractApiError(error);
    expect(apiError.message).toBe("Vous n'êtes pas autorisé à effectuer cette action.");
  });

  it('maps 500 to generic server error', () => {
    const error = new AxiosError('Server Error', '500', undefined, undefined, {
      status: 500,
      data: {},
      headers: {},
      statusText: 'Internal Server Error',
      config: {} as any,
    });
    const apiError = extractApiError(error);
    expect(apiError.message).toBe('Une erreur est survenue. Veuillez réessayer.');
  });

  it('maps network error to connection message', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK');
    const apiError = extractApiError(error);
    expect(apiError.message).toBe('Connexion impossible. Vérifiez votre réseau.');
  });

  it('maps timeout to timeout message', () => {
    const error = new AxiosError('timeout', 'ECONNABORTED');
    const apiError = extractApiError(error);
    expect(apiError.message).toBe('La connexion a expiré. Vérifiez votre réseau.');
  });

  it('uses backend message when provided', () => {
    const error = new AxiosError('Bad Request', '400', undefined, undefined, {
      status: 400,
      data: { message: 'Le code est incorrect.' },
      headers: {},
      statusText: 'Bad Request',
      config: {} as any,
    });
    const apiError = extractApiError(error);
    expect(apiError.message).toBe('Le code est incorrect.');
  });

  it('never exposes raw technical errors', () => {
    const error = extractApiError(new Error('Cannot read property x of undefined'));
    expect(error.message).not.toContain('Cannot read');
    expect(error.message).toBe('Une erreur inattendue est survenue.');
  });
});

describe('Auth Flow - Role Routing', () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false, role: null, userId: null, isLoading: false });
  });

  it('unauthenticated user gets null role', () => {
    const { role, isAuthenticated } = useAuthStore.getState();
    expect(isAuthenticated).toBe(false);
    expect(role).toBeNull();
  });

  it('CLIENT login sets CLIENT role', async () => {
    await useAuthStore.getState().login('u1', 'CLIENT', 'at', 'rt');
    expect(useAuthStore.getState().role).toBe('CLIENT');
  });

  it('PROFESSIONAL login sets PROFESSIONAL role', async () => {
    await useAuthStore.getState().login('u1', 'PROFESSIONAL', 'at', 'rt');
    expect(useAuthStore.getState().role).toBe('PROFESSIONAL');
  });
});

describe('Auth Flow - Session Expired Handler', () => {
  it('setSessionExpiredHandler is a function', () => {
    expect(typeof setSessionExpiredHandler).toBe('function');
  });
});

describe('Auth Flow - Secure Storage', () => {
  it('tokens are stored in SecureStore on login', async () => {
    const SecureStore = require('expo-secure-store');
    await useAuthStore.getState().login('u1', 'CLIENT', 'my-access', 'my-refresh');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('monpro_access_token', 'my-access');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('monpro_refresh_token', 'my-refresh');
  });

  it('tokens are cleared from SecureStore on logout', async () => {
    const SecureStore = require('expo-secure-store');
    await useAuthStore.getState().logout();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('monpro_access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('monpro_refresh_token');
  });
});
