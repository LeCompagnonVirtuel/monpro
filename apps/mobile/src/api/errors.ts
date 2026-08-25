import { AxiosError } from 'axios';

export class ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    this.status = status;
    this.code = code;
    this.message = message;
    this.details = details;
  }

  static fromAxios(error: AxiosError): ApiError {
    const status = error.response?.status || 0;
    const data = error.response?.data as { message?: string | string[]; error?: string } | undefined;

    if (!data) {
      if (error.code === 'ECONNABORTED') {
        return new ApiError(0, 'TIMEOUT', 'La connexion a expiré. Vérifiez votre réseau.');
      }
      return new ApiError(0, 'NETWORK_ERROR', 'Connexion impossible. Vérifiez votre réseau.');
    }

    const rawMessage = Array.isArray(data.message) ? data.message[0] : data.message;
    const code = data.error || `HTTP_${status}`;
    const message = rawMessage || 'Une erreur est survenue.';

    return new ApiError(status, code, message, data);
  }
}

export function extractApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof AxiosError) return ApiError.fromAxios(error);
  return new ApiError(0, 'UNKNOWN', 'Une erreur inattendue est survenue.');
}
