import { useQuery } from '@tanstack/react-query';
import { geographyApi } from '@/api/geography';

export function useCountries() {
  return useQuery({
    queryKey: ['geography', 'countries'],
    queryFn: async () => {
      const { data } = await geographyApi.listCountries();
      return data.data;
    },
  });
}

export function useRegions(countryId: string | undefined) {
  return useQuery({
    queryKey: ['geography', 'regions', countryId],
    queryFn: async () => {
      const { data } = await geographyApi.listRegions(countryId!);
      return data.data;
    },
    enabled: !!countryId,
  });
}

export function useCities(regionId: string | undefined) {
  return useQuery({
    queryKey: ['geography', 'cities', regionId],
    queryFn: async () => {
      const { data } = await geographyApi.listCities(regionId!);
      return data.data;
    },
    enabled: !!regionId,
  });
}

export function useDistricts(cityId: string | undefined) {
  return useQuery({
    queryKey: ['geography', 'districts', cityId],
    queryFn: async () => {
      const { data } = await geographyApi.listDistricts(cityId!);
      return data.data;
    },
    enabled: !!cityId,
  });
}

export function useNeighborhoods(districtId: string | undefined) {
  return useQuery({
    queryKey: ['geography', 'neighborhoods', districtId],
    queryFn: async () => {
      const { data } = await geographyApi.listNeighborhoods(districtId!);
      return data.data;
    },
    enabled: !!districtId,
  });
}
