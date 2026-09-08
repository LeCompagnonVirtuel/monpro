import { AxiosError } from 'axios';

type ErrorWithResponse = {
  response?: { status?: number };
  isAxiosError?: boolean;
  message?: string;
};

export function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as ErrorWithResponse;

  if (err?.isAxiosError && !err?.response) {
    return 'Vérifiez votre connexion Internet et réessayez.';
  }

  const status = err?.response?.status;

  if (status === 401) return 'Votre session a expiré. Veuillez vous reconnecter.';
  if (status === 403) return "Vous n'avez pas accès à cette ressource.";
  if (status === 404) return 'Ressource introuvable.';
  if (status === 408) return 'La requête a pris trop de temps. Réessayez dans quelques instants.';
  if (status === 429) return 'Trop de requêtes. Patientez un instant puis réessayez.';
  if (status && status >= 500) return 'Le service est temporairement indisponible. Réessayez dans quelques instants.';

  return fallback;
}
