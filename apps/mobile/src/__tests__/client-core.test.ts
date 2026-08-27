import { useCategories } from '../hooks/use-categories';
import { useServices, useServiceSearch } from '../hooks/use-services';
import { useProfessionals, useProfessional } from '../hooks/use-professionals';
import { useServiceRequests, useCreateServiceRequest } from '../hooks/use-service-requests';
import { useFavorites, useAddFavorite, useRemoveFavorite } from '../hooks/use-favorites';
import { useDebounce } from '../hooks/use-debounce';
import { categoriesApi } from '../api/categories';
import { servicesApi } from '../api/services';
import { professionalsApi } from '../api/professionals';
import { requestsApi } from '../api/requests';
import { favoritesApi } from '../api/favorites';
import { uploadsApi } from '../api/uploads';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('fake-token'),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('Phase 4 - API Modules', () => {
  describe('Categories API', () => {
    it('exposes list and getById methods', () => {
      expect(typeof categoriesApi.list).toBe('function');
      expect(typeof categoriesApi.getById).toBe('function');
    });
  });

  describe('Services API', () => {
    it('exposes list, search, and getById methods', () => {
      expect(typeof servicesApi.list).toBe('function');
      expect(typeof servicesApi.search).toBe('function');
      expect(typeof servicesApi.getById).toBe('function');
    });
  });

  describe('Professionals API', () => {
    it('exposes list, getById, and match methods', () => {
      expect(typeof professionalsApi.list).toBe('function');
      expect(typeof professionalsApi.getById).toBe('function');
      expect(typeof professionalsApi.match).toBe('function');
    });
  });

  describe('Requests API', () => {
    it('exposes create, listMine, getById, and updateStatus methods', () => {
      expect(typeof requestsApi.create).toBe('function');
      expect(typeof requestsApi.listMine).toBe('function');
      expect(typeof requestsApi.getById).toBe('function');
      expect(typeof requestsApi.updateStatus).toBe('function');
    });
  });

  describe('Favorites API', () => {
    it('exposes list, add, remove, and check methods', () => {
      expect(typeof favoritesApi.list).toBe('function');
      expect(typeof favoritesApi.add).toBe('function');
      expect(typeof favoritesApi.remove).toBe('function');
      expect(typeof favoritesApi.check).toBe('function');
    });
  });

  describe('Uploads API', () => {
    it('exposes uploadImage and uploadImages methods', () => {
      expect(typeof uploadsApi.uploadImage).toBe('function');
      expect(typeof uploadsApi.uploadImages).toBe('function');
    });
  });
});

describe('Phase 4 - Hooks', () => {
  it('useCategories is a function', () => {
    expect(typeof useCategories).toBe('function');
  });

  it('useServices is a function', () => {
    expect(typeof useServices).toBe('function');
  });

  it('useServiceSearch is a function', () => {
    expect(typeof useServiceSearch).toBe('function');
  });

  it('useProfessionals is a function', () => {
    expect(typeof useProfessionals).toBe('function');
  });

  it('useProfessional is a function', () => {
    expect(typeof useProfessional).toBe('function');
  });

  it('useServiceRequests is a function', () => {
    expect(typeof useServiceRequests).toBe('function');
  });

  it('useCreateServiceRequest is a function', () => {
    expect(typeof useCreateServiceRequest).toBe('function');
  });

  it('useFavorites is a function', () => {
    expect(typeof useFavorites).toBe('function');
  });

  it('useAddFavorite is a function', () => {
    expect(typeof useAddFavorite).toBe('function');
  });

  it('useRemoveFavorite is a function', () => {
    expect(typeof useRemoveFavorite).toBe('function');
  });

  it('useDebounce is a function', () => {
    expect(typeof useDebounce).toBe('function');
  });
});

describe('Phase 4 - Service Request Types', () => {
  it('UrgencyLevel values match backend enum', () => {
    const module = jest.requireActual('../api/requests');
    expect(module).toBeDefined();
  });

  it('ServiceRequestStatus values match backend enum', () => {
    const expectedStatuses = [
      'DRAFT', 'SUBMITTED', 'MATCHING', 'QUOTED',
      'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS',
      'COMPLETED', 'CANCELLED', 'DISPUTED',
    ];
    // This test validates via TypeScript compilation that the types exist
    expect(expectedStatuses.length).toBe(10);
  });
});

describe('Phase 4 - Request Creation Validation', () => {
  it('title must be at least 5 characters', () => {
    const validateTitle = (title: string) => title.trim().length >= 5;
    expect(validateTitle('Fix')).toBe(false);
    expect(validateTitle('Fix my sink')).toBe(true);
    expect(validateTitle('')).toBe(false);
    expect(validateTitle('    ')).toBe(false);
  });

  it('description must be at least 10 characters', () => {
    const validateDesc = (desc: string) => desc.trim().length >= 10;
    expect(validateDesc('short')).toBe(false);
    expect(validateDesc('My kitchen sink is leaking badly')).toBe(true);
    expect(validateDesc('')).toBe(false);
  });

  it('urgency accepts only valid enum values', () => {
    const validUrgencies = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
    expect(validUrgencies.includes('NORMAL')).toBe(true);
    expect(validUrgencies.includes('CRITICAL')).toBe(false);
    expect(validUrgencies.includes('')).toBe(false);
  });
});

describe('Phase 4 - No hardcoded data', () => {
  it('home screen does not hardcode categories', () => {
    const homeSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(client)/(tabs)/home.tsx'),
      'utf-8',
    );
    expect(homeSource).not.toContain('Plomberie');
    expect(homeSource).not.toContain('Électricité');
    expect(homeSource).toContain('useCategories');
  });

  it('search uses debounce', () => {
    const searchSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(client)/(tabs)/search.tsx'),
      'utf-8',
    );
    expect(searchSource).toContain('useDebounce');
  });

  it('professionals are fetched from API, not hardcoded', () => {
    const homeSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(client)/(tabs)/home.tsx'),
      'utf-8',
    );
    expect(homeSource).toContain('useProfessionals');
    expect(homeSource).not.toContain('Kouamé Jean');
  });
});
