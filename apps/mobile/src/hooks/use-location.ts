import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface UseLocationResult {
  location: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
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

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setError('Impossible de récupérer votre position');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return { location, isLoading, error, refresh: fetchLocation };
}
