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

export interface RegisterEmailPayload {
  email: string;
  password: string;
  fullName: string;
  role?: 'CLIENT' | 'PROFESSIONAL';
  cityId?: string;
  countryId?: string;
}

export interface LoginEmailPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface VerifyOtpExistingUser {
  isNewUser: false;
  user: { id: string; fullName: string; role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN' };
  accessToken: string;
  refreshToken: string;
}

export interface VerifyOtpNewUser {
  isNewUser: true;
  phone: string;
}

export type VerifyOtpResponse = VerifyOtpExistingUser | VerifyOtpNewUser;

export interface RegisterResponse {
  user: { id: string; phone?: string; email?: string; fullName: string; role: string };
  accessToken: string;
  refreshToken: string;
}

export interface LoginEmailResponse {
  user: { id: string; email: string; fullName: string; role: string };
  accessToken: string;
  refreshToken: string;
}

export interface RequestOtpResponse {
  message: string;
  expiresIn: number;
}

export const authApi = {
  requestOtp(payload: RequestOtpPayload) {
    return apiClient.post<{ success: boolean; data: RequestOtpResponse }>(
      '/auth/request-otp',
      payload,
    );
  },

  verifyOtp(payload: VerifyOtpPayload) {
    return apiClient.post<{ success: boolean; data: VerifyOtpResponse }>(
      '/auth/verify-otp',
      payload,
    );
  },

  register(payload: RegisterPayload) {
    return apiClient.post<{ success: boolean; data: RegisterResponse }>(
      '/auth/register',
      payload,
    );
  },

  registerEmail(payload: RegisterEmailPayload) {
    return apiClient.post<{ success: boolean; data: RegisterResponse }>(
      '/auth/register-email',
      payload,
    );
  },

  loginEmail(payload: LoginEmailPayload) {
    return apiClient.post<{ success: boolean; data: LoginEmailResponse }>(
      '/auth/login-email',
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
