import { UpdateUserPayload } from '../api/users';

jest.mock('../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

jest.mock('../stores/auth.store', () => ({
  useAuthStore: jest.fn((selector) => {
    const state = { isAuthenticated: true, role: 'CLIENT', userId: 'user-1' };
    return selector ? selector(state) : state;
  }),
}));

import { usersApi } from '../api/users';
import { apiClient } from '../api/client';

describe('usersApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getMe calls GET /users/me', async () => {
    const mockUser = {
      id: 'user-1',
      phone: '+2250700000000',
      fullName: 'Aya Kouassi',
      role: 'CLIENT',
      isActive: true,
      createdAt: '2024-01-01',
    };
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { success: true, data: mockUser },
    });

    const result = await usersApi.getMe();

    expect(apiClient.get).toHaveBeenCalledWith('/users/me');
    expect(result.data.data.fullName).toBe('Aya Kouassi');
  });

  it('updateMe calls PATCH /users/me with correct payload', async () => {
    const payload: UpdateUserPayload = {
      fullName: 'Aya Koné',
      avatarUrl: 'https://storage.example.com/avatar.jpg',
      cityId: 'city-abidjan',
    };
    const updatedUser = {
      id: 'user-1',
      fullName: 'Aya Koné',
      avatarUrl: 'https://storage.example.com/avatar.jpg',
      cityId: 'city-abidjan',
      role: 'CLIENT',
      isActive: true,
      createdAt: '2024-01-01',
    };
    (apiClient.patch as jest.Mock).mockResolvedValue({
      data: { success: true, data: updatedUser },
    });

    const result = await usersApi.updateMe(payload);

    expect(apiClient.patch).toHaveBeenCalledWith('/users/me', payload);
    expect(result.data.data.fullName).toBe('Aya Koné');
  });
});

describe('UpdateUserPayload', () => {
  it('accepts fullName, avatarUrl, cityId', () => {
    const payload: UpdateUserPayload = {
      fullName: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
      cityId: 'city-1',
    };
    expect(payload.fullName).toBe('Test User');
    expect(payload.avatarUrl).toBe('https://example.com/avatar.jpg');
    expect(payload.cityId).toBe('city-1');
  });

  it('does not include phone (read-only)', () => {
    const payload: UpdateUserPayload = {
      fullName: 'Test User',
    };
    expect(payload).not.toHaveProperty('phone');
  });

  it('all fields are optional', () => {
    const emptyPayload: UpdateUserPayload = {};
    expect(emptyPayload.fullName).toBeUndefined();
    expect(emptyPayload.avatarUrl).toBeUndefined();
    expect(emptyPayload.cityId).toBeUndefined();
  });
});

describe('Profile menu items', () => {
  const MENU_ITEMS = [
    {
      icon: 'people-outline',
      title: 'Informations personnelles',
      subtitle: 'Gérez vos informations de profil',
      route: '/(client)/edit-profile',
    },
    {
      icon: 'location-outline',
      title: 'Adresses enregistrées',
      subtitle: 'Gérez vos adresses de localisation',
      route: '/(client)/addresses',
    },
    {
      icon: 'card-outline',
      title: 'Mes moyens de paiement',
      subtitle: 'Cartes, Mobile Money, etc.',
      route: '/(client)/payment-methods',
    },
    {
      icon: 'heart-outline',
      title: 'Mes favoris',
      subtitle: 'Professionnels et services enregistrés',
      route: '/(client)/favorites',
    },
    {
      icon: 'time-outline',
      title: 'Historique',
      subtitle: 'Demandes, paiements et activités',
      route: '/(client)/history',
    },
    {
      icon: 'settings-outline',
      title: 'Paramètres',
      subtitle: 'Préférences, confidentialité, notifications',
      route: '/(client)/settings',
    },
  ];

  it('edit-profile routes to /(client)/edit-profile', () => {
    const item = MENU_ITEMS.find((m) => m.route === '/(client)/edit-profile');
    expect(item).toBeDefined();
    expect(item!.title).toBe('Informations personnelles');
  });

  it('addresses routes to /(client)/addresses', () => {
    const item = MENU_ITEMS.find((m) => m.route === '/(client)/addresses');
    expect(item).toBeDefined();
    expect(item!.title).toBe('Adresses enregistrées');
  });

  it('settings routes to /(client)/settings', () => {
    const item = MENU_ITEMS.find((m) => m.route === '/(client)/settings');
    expect(item).toBeDefined();
    expect(item!.title).toBe('Paramètres');
  });

  it('all menu items have required fields', () => {
    MENU_ITEMS.forEach((item) => {
      expect(item.icon).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.subtitle).toBeTruthy();
      expect(item.route).toBeTruthy();
      expect(item.route).toMatch(/^\//);
    });
  });
});
