import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface ReverseAddress {
  city: string | null;
  district: string | null;
  region: string | null;
  country: string | null;
  formattedAddress: string | null;
}

interface UseLocationResult {
  location: UserLocation | null;
  address: ReverseAddress | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

let cachedLocation: UserLocation | null = null;
let cachedAddress: ReverseAddress | null = null;

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(cachedLocation);
  const [address, setAddress] = useState<ReverseAddress | null>(cachedAddress);
  const [isLoading, setIsLoading] = useState(!cachedLocation);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(!!cachedLocation);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission de localisation refusée');
        setIsLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const loc: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(loc);
      cachedLocation = loc;

      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: loc.latitude,
          longitude: loc.longitude,
        });

        if (geo) {
          const addr: ReverseAddress = {
            city: geo.city || geo.subregion || null,
            district: geo.district || geo.name || null,
            region: geo.region || null,
            country: geo.country || null,
            formattedAddress: [geo.district, geo.city, geo.region].filter(Boolean).join(', ') || null,
          };
          setAddress(addr);
          cachedAddress = addr;
        }
      } catch {
        // Reverse geocoding failed — location still usable
      }
    } catch {
      setError('Impossible de récupérer votre position');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      fetchLocation();
    }
  }, [fetchLocation]);

  return { location, address, isLoading, error, refresh: fetchLocation };
}
