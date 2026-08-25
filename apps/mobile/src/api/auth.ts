import { apiClient } from './client';

export interface RequestOtpPayload {
  phone: string;
}

export interface VerifyOtpPayload {
  phone: string;
  code: string;
}

export interface RegisterPayload {
  phone: string;
  fullName: string;
  role?: 'CLIENT' | 'PROFESSIONAL';
  cityId?: string;
  countryId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user?: {
    id: string;
    phone: string;
    fullName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
  isNewUser?: boolean;
}

export const authApi = {
  requestOtp(payload: RequestOtpPayload) {
    return apiClient.post<{ success: boolean; data: { message: string } }>(
      '/auth/request-otp',
      payload,
    );
  },

  verifyOtp(payload: VerifyOtpPayload) {
    return apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/verify-otp',
      payload,
    );
  },

  register(payload: RegisterPayload) {
    return apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/register',
      payload,
    );
  },

  refresh(refreshToken: string) {
    return apiClient.post<{ success: boolean; data: AuthTokens }>(
      '/auth/refresh',
      { refreshToken },
    );
  },

  logout() {
    return apiClient.post('/auth/logout');
  },
};
