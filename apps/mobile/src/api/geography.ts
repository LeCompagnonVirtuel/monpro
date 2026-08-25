import { apiClient } from './client';

export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface Region {
  id: string;
  name: string;
  countryId: string;
}

export interface City {
  id: string;
  name: string;
  regionId: string;
}

export interface District {
  id: string;
  name: string;
  cityId: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  districtId: string;
}

export const geographyApi = {
  listCountries() {
    return apiClient.get<{ success: boolean; data: Country[] }>('/geography/countries');
  },

  listRegions(countryId: string) {
    return apiClient.get<{ success: boolean; data: Region[] }>(
      `/geography/countries/${countryId}/regions`,
    );
  },

  listCities(regionId: string) {
    return apiClient.get<{ success: boolean; data: City[] }>(
      `/geography/regions/${regionId}/cities`,
    );
  },

  listDistricts(cityId: string) {
    return apiClient.get<{ success: boolean; data: District[] }>(
      `/geography/cities/${cityId}/districts`,
    );
  },

  listNeighborhoods(districtId: string) {
    return apiClient.get<{ success: boolean; data: Neighborhood[] }>(
      `/geography/districts/${districtId}/neighborhoods`,
    );
  },
};
