import { apiClient } from './client';

export type KycDocumentType = 'CNI' | 'PASSPORT' | 'DRIVER_LICENSE' | 'BUSINESS_REGISTRATION';

export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycDocument {
  id: string;
  documentType: KycDocumentType;
  documentNumber: string;
  frontUrl: string;
  backUrl?: string;
  selfieUrl: string;
  status: KycStatus;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface SubmitKycPayload {
  documentType: KycDocumentType;
  documentNumber: string;
  frontUrl: string;
  backUrl?: string;
  selfieUrl: string;
}

export const kycApi = {
  submit(data: SubmitKycPayload) {
    return apiClient.post<{ success: boolean; data: KycDocument }>(
      '/professionals/me/kyc',
      data,
    );
  },

  getMyKyc() {
    return apiClient.get<{ success: boolean; data: KycDocument }>(
      '/professionals/me/kyc',
    );
  },
};
