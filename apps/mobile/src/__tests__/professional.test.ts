import { professionalsApi } from '../api/professionals';
import { requestsApi } from '../api/requests';
import { quotesApi } from '../api/quotes';
import { bookingsApi } from '../api/bookings';
import { interventionsApi } from '../api/interventions';
import { reviewsApi } from '../api/reviews';
import { ledgerApi } from '../api/ledger';
import { geographyApi } from '../api/geography';

import { useMyProfessionalProfile, useCreateProfessionalProfile, useUpdateProfessionalProfile } from '../hooks/use-professional-profile';
import { useProfessionalRequests, useProfessionalRequest } from '../hooks/use-professional-requests';
import { useProfessionalQuotes, useCreateQuote } from '../hooks/use-professional-quotes';
import { useProfessionalBookings, useProfessionalBooking, useUpdateBookingStatus } from '../hooks/use-professional-bookings';
import { useProfessionalIntervention, useCreateIntervention, useMarkArrived, useStartIntervention, useCompleteIntervention } from '../hooks/use-professional-interventions';
import { useProfessionalAvailability, useSetAvailability } from '../hooks/use-professional-availability';
import { useProfessionalWallet } from '../hooks/use-professional-revenue';
import { useProfessionalReviews, useRespondToReview } from '../hooks/use-professional-reviews';
import { useCountries, useRegions, useCities, useDistricts, useNeighborhoods } from '../hooks/use-geography';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('fake-token'),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('Phase 7 - Professional API Modules', () => {
  describe('Professionals API', () => {
    it('exposes create and update methods', () => {
      expect(typeof professionalsApi.create).toBe('function');
      expect(typeof professionalsApi.update).toBe('function');
    });

    it('exposes availability methods', () => {
      expect(typeof professionalsApi.getAvailability).toBe('function');
      expect(typeof professionalsApi.setAvailability).toBe('function');
    });
  });

  describe('Requests API (Professional)', () => {
    it('exposes getAvailable for professionals', () => {
      expect(typeof requestsApi.getAvailable).toBe('function');
    });

    it('exposes getById for request detail', () => {
      expect(typeof requestsApi.getById).toBe('function');
    });
  });

  describe('Quotes API (Professional)', () => {
    it('exposes create method', () => {
      expect(typeof quotesApi.create).toBe('function');
    });

    it('exposes listByProfessional method', () => {
      expect(typeof quotesApi.listByProfessional).toBe('function');
    });
  });

  describe('Bookings API (Professional)', () => {
    it('exposes listByProfessional and updateStatus', () => {
      expect(typeof bookingsApi.listByProfessional).toBe('function');
      expect(typeof bookingsApi.updateStatus).toBe('function');
    });
  });

  describe('Interventions API', () => {
    it('exposes full lifecycle: create, markArrived, start, complete', () => {
      expect(typeof interventionsApi.create).toBe('function');
      expect(typeof interventionsApi.markArrived).toBe('function');
      expect(typeof interventionsApi.start).toBe('function');
      expect(typeof interventionsApi.complete).toBe('function');
    });
  });

  describe('Reviews API (Professional)', () => {
    it('exposes respond method', () => {
      expect(typeof reviewsApi.respond).toBe('function');
    });
  });

  describe('Ledger API', () => {
    it('exposes getWallet method', () => {
      expect(typeof ledgerApi.getWallet).toBe('function');
    });
  });

  describe('Geography API', () => {
    it('exposes full hierarchy', () => {
      expect(typeof geographyApi.listCountries).toBe('function');
      expect(typeof geographyApi.listRegions).toBe('function');
      expect(typeof geographyApi.listCities).toBe('function');
      expect(typeof geographyApi.listDistricts).toBe('function');
      expect(typeof geographyApi.listNeighborhoods).toBe('function');
    });
  });
});

describe('Phase 7 - Professional Hooks', () => {
  describe('Profile', () => {
    it('useMyProfessionalProfile is a function', () => {
      expect(typeof useMyProfessionalProfile).toBe('function');
    });

    it('useCreateProfessionalProfile is a function', () => {
      expect(typeof useCreateProfessionalProfile).toBe('function');
    });

    it('useUpdateProfessionalProfile is a function', () => {
      expect(typeof useUpdateProfessionalProfile).toBe('function');
    });
  });

  describe('Requests', () => {
    it('useProfessionalRequests is a function', () => {
      expect(typeof useProfessionalRequests).toBe('function');
    });

    it('useProfessionalRequest is a function', () => {
      expect(typeof useProfessionalRequest).toBe('function');
    });
  });

  describe('Quotes', () => {
    it('useProfessionalQuotes is a function', () => {
      expect(typeof useProfessionalQuotes).toBe('function');
    });

    it('useCreateQuote is a function', () => {
      expect(typeof useCreateQuote).toBe('function');
    });
  });

  describe('Bookings', () => {
    it('useProfessionalBookings is a function', () => {
      expect(typeof useProfessionalBookings).toBe('function');
    });

    it('useProfessionalBooking is a function', () => {
      expect(typeof useProfessionalBooking).toBe('function');
    });

    it('useUpdateBookingStatus is a function', () => {
      expect(typeof useUpdateBookingStatus).toBe('function');
    });
  });

  describe('Interventions', () => {
    it('useProfessionalIntervention is a function', () => {
      expect(typeof useProfessionalIntervention).toBe('function');
    });

    it('useCreateIntervention is a function', () => {
      expect(typeof useCreateIntervention).toBe('function');
    });

    it('useMarkArrived is a function', () => {
      expect(typeof useMarkArrived).toBe('function');
    });

    it('useStartIntervention is a function', () => {
      expect(typeof useStartIntervention).toBe('function');
    });

    it('useCompleteIntervention is a function', () => {
      expect(typeof useCompleteIntervention).toBe('function');
    });
  });

  describe('Availability', () => {
    it('useProfessionalAvailability is a function', () => {
      expect(typeof useProfessionalAvailability).toBe('function');
    });

    it('useSetAvailability is a function', () => {
      expect(typeof useSetAvailability).toBe('function');
    });
  });

  describe('Revenue', () => {
    it('useProfessionalWallet is a function', () => {
      expect(typeof useProfessionalWallet).toBe('function');
    });
  });

  describe('Reviews', () => {
    it('useProfessionalReviews is a function', () => {
      expect(typeof useProfessionalReviews).toBe('function');
    });

    it('useRespondToReview is a function', () => {
      expect(typeof useRespondToReview).toBe('function');
    });
  });

  describe('Geography', () => {
    it('useCountries is a function', () => {
      expect(typeof useCountries).toBe('function');
    });

    it('useRegions is a function', () => {
      expect(typeof useRegions).toBe('function');
    });

    it('useCities is a function', () => {
      expect(typeof useCities).toBe('function');
    });

    it('useDistricts is a function', () => {
      expect(typeof useDistricts).toBe('function');
    });

    it('useNeighborhoods is a function', () => {
      expect(typeof useNeighborhoods).toBe('function');
    });
  });
});

describe('Phase 7 - Security', () => {
  it('professional layout guards against non-professional role', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(professional)/_layout.tsx'),
      'utf-8',
    );
    expect(source).toContain("role !== 'PROFESSIONAL'");
    expect(source).toContain('Redirect');
  });

  it('professional layout requires authentication', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(professional)/_layout.tsx'),
      'utf-8',
    );
    expect(source).toContain('!isAuthenticated');
    expect(source).toContain('/(auth)/welcome');
  });

  it('no hardcoded verification badge - uses backend status', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(professional)/(tabs)/dashboard.tsx'),
      'utf-8',
    );
    expect(source).toContain('verificationStatus');
    expect(source).not.toContain("'VERIFIED':");
    expect(source).not.toMatch(/isVerified:\s*true/);
  });

  it('quote creation sends to backend - no local total as source of truth', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(professional)/create-quote.tsx'),
      'utf-8',
    );
    expect(source).toContain('createQuote.mutateAsync');
    expect(source).toContain('Le montant final sera confirmé par le serveur');
  });

  it('intervention transitions call API - not local state only', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(professional)/intervention.tsx'),
      'utf-8',
    );
    expect(source).toContain('markArrived.mutate');
    expect(source).toContain('startIntervention.mutate');
    expect(source).toContain('completeIntervention.mutate');
  });

  it('revenue displays backend data - no local recalculation', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(professional)/revenue.tsx'),
      'utf-8',
    );
    expect(source).toContain('useProfessionalWallet');
    expect(source).toContain('wallet.balance');
    expect(source).not.toContain('totalAmount * 0.');
  });

  it('no tokens or secrets in professional screens', () => {
    const files = [
      '../app/(professional)/(tabs)/dashboard.tsx',
      '../app/(professional)/create-quote.tsx',
      '../app/(professional)/intervention.tsx',
      '../app/(professional)/revenue.tsx',
      '../app/(professional)/onboarding.tsx',
    ];
    files.forEach((file) => {
      const source = require('fs').readFileSync(
        require('path').resolve(__dirname, file),
        'utf-8',
      );
      expect(source).not.toContain('sk_');
      expect(source).not.toContain('secret');
      expect(source).not.toMatch(/Bearer [A-Za-z0-9]/);
      expect(source).not.toContain('console.log');
    });
  });

  it('wallet does not expose payout without backend support', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(professional)/revenue.tsx'),
      'utf-8',
    );
    expect(source).toContain('Les retraits seront disponibles prochainement');
    expect(source).not.toContain('Retirer');
  });
});

describe('Phase 7 - Navigation', () => {
  it('professional layout includes all required routes', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(professional)/_layout.tsx'),
      'utf-8',
    );
    expect(source).toContain('"(tabs)"');
    expect(source).toContain('"onboarding"');
    expect(source).toContain('"request-detail"');
    expect(source).toContain('"create-quote"');
    expect(source).toContain('"intervention"');
    expect(source).toContain('"revenue"');
    expect(source).toContain('"reviews"');
    expect(source).toContain('"services"');
    expect(source).toContain('"availability"');
    expect(source).toContain('"notifications"');
    expect(source).toContain('"conversation"');
  });
});

describe('Phase 7 - No hardcoded data', () => {
  it('dashboard uses hooks for real data', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(professional)/(tabs)/dashboard.tsx'),
      'utf-8',
    );
    expect(source).toContain('useMyProfessionalProfile');
    expect(source).toContain('useProfessionalRequests');
    expect(source).toContain('useProfessionalWallet');
    expect(source).not.toContain('fake-');
  });

  it('requests screen uses useProfessionalRequests hook', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(professional)/(tabs)/requests.tsx'),
      'utf-8',
    );
    expect(source).toContain('useProfessionalRequests');
  });

  it('interventions screen uses useProfessionalBookings hook', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(professional)/(tabs)/interventions.tsx'),
      'utf-8',
    );
    expect(source).toContain('useProfessionalBookings');
  });
});
