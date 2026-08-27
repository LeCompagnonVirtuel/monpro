import { AxiosError } from 'axios';

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Les données envoyées sont incorrectes.',
  401: 'Votre session a expiré.',
  403: "Vous n'êtes pas autorisé à effectuer cette action.",
  404: "Cette ressource n'existe pas ou a été supprimée.",
  409: 'Cette action a déjà été effectuée.',
  413: 'Le fichier est trop volumineux.',
  422: 'Les données envoyées sont invalides.',
  429: 'Trop de tentatives. Veuillez patienter avant de réessayer.',
  500: 'Une erreur est survenue. Veuillez réessayer.',
  502: 'Le serveur est temporairement indisponible.',
  503: 'Le serveur est en maintenance. Veuillez réessayer plus tard.',
};

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
    const message = rawMessage || STATUS_MESSAGES[status] || 'Une erreur inattendue est survenue.';

    return new ApiError(status, code, message, data);
  }
}

export function extractApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof AxiosError) return ApiError.fromAxios(error);
  return new ApiError(0, 'UNKNOWN', 'Une erreur inattendue est survenue.');
}
