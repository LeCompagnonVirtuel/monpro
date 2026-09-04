import { apiClient } from './client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  sortOrder: number;
  isActive: boolean;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  services?: { id: string; name: string; slug: string; description?: string; isActive: boolean }[];
}

export const categoriesApi = {
  list(params?: { includeInactive?: boolean }) {
    return apiClient.get<{ success: boolean; data: Category[] }>('/categories', { params });
  },

  getById(id: string) {
    return apiClient.get<{ success: boolean; data: Category }>(`/categories/${id}`);
  },
};
