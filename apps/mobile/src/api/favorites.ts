import { apiClient } from './client';
import { Professional } from './professionals';

export const favoritesApi = {
  list() {
    return apiClient.get<{ success: boolean; data: Professional[] }>('/favorites');
  },

  add(professionalId: string) {
    return apiClient.post(`/favorites/professionals/${professionalId}`);
  },

  remove(professionalId: string) {
    return apiClient.delete(`/favorites/professionals/${professionalId}`);
  },

  check(professionalId: string) {
    return apiClient.get<{ success: boolean; data: { isFavorite: boolean } }>(
      `/favorites/professionals/${professionalId}/check`,
    );
  },
};
