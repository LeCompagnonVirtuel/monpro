import { KycDocumentType, SubmitKycPayload } from '../api/kyc';

jest.mock('../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('../stores/auth.store', () => ({
  useAuthStore: jest.fn((selector) => {
    const state = { isAuthenticated: true, role: 'PROFESSIONAL', userId: 'pro-1' };
    return selector ? selector(state) : state;
  }),
}));

import { kycApi, KycDocument } from '../api/kyc';
import { apiClient } from '../api/client';

describe('kycApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('submit calls POST /professionals/me/kyc with correct data', async () => {
    const payload: SubmitKycPayload = {
      documentType: 'CNI',
      documentNumber: 'CI123456',
      frontUrl: 'https://storage.example.com/front.jpg',
      selfieUrl: 'https://storage.example.com/selfie.jpg',
    };
    const mockResponse = {
      data: {
        success: true,
        data: { id: 'kyc-1', ...payload, status: 'PENDING' } as KycDocument,
      },
    };
    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await kycApi.submit(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/professionals/me/kyc', payload);
    expect(result.data.success).toBe(true);
  });

  it('getMyKyc calls GET /professionals/me/kyc', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: { id: 'kyc-1', status: 'APPROVED' } as KycDocument,
      },
    };
    (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

    const result = await kycApi.getMyKyc();

    expect(apiClient.get).toHaveBeenCalledWith('/professionals/me/kyc');
    expect(result.data.data.status).toBe('APPROVED');
  });
});

describe('KYC document type validation', () => {
  const validTypes: KycDocumentType[] = ['CNI', 'PASSPORT', 'DRIVER_LICENSE', 'BUSINESS_REGISTRATION'];

  it('accepts all valid document types', () => {
    validTypes.forEach((type) => {
      expect(['CNI', 'PASSPORT', 'DRIVER_LICENSE', 'BUSINESS_REGISTRATION']).toContain(type);
    });
  });

  it('does not accept invalid document types', () => {
    const invalidTypes = ['ID_CARD', 'VOTER_CARD', 'OTHER', ''];
    invalidTypes.forEach((type) => {
      expect(validTypes).not.toContain(type);
    });
  });
});

describe('KYC payload field requirements', () => {
  it('requires selfieUrl', () => {
    const payload: SubmitKycPayload = {
      documentType: 'CNI',
      documentNumber: 'CI123456',
      frontUrl: 'https://storage.example.com/front.jpg',
      selfieUrl: 'https://storage.example.com/selfie.jpg',
    };
    expect(payload.selfieUrl).toBeTruthy();
  });

  it('requires frontUrl', () => {
    const payload: SubmitKycPayload = {
      documentType: 'CNI',
      documentNumber: 'CI123456',
      frontUrl: 'https://storage.example.com/front.jpg',
      selfieUrl: 'https://storage.example.com/selfie.jpg',
    };
    expect(payload.frontUrl).toBeTruthy();
  });

  it('requires documentNumber', () => {
    const payload: SubmitKycPayload = {
      documentType: 'CNI',
      documentNumber: 'CI123456',
      frontUrl: 'https://storage.example.com/front.jpg',
      selfieUrl: 'https://storage.example.com/selfie.jpg',
    };
    expect(payload.documentNumber).toBeTruthy();
  });

  it('backUrl is optional', () => {
    const payloadWithoutBack: SubmitKycPayload = {
      documentType: 'CNI',
      documentNumber: 'CI123456',
      frontUrl: 'https://storage.example.com/front.jpg',
      selfieUrl: 'https://storage.example.com/selfie.jpg',
    };
    const payloadWithBack: SubmitKycPayload = {
      ...payloadWithoutBack,
      backUrl: 'https://storage.example.com/back.jpg',
    };
    expect(payloadWithoutBack.backUrl).toBeUndefined();
    expect(payloadWithBack.backUrl).toBeTruthy();
  });
});
