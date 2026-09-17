import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { useMutation } from '@tanstack/react-query';
import { professionalsApi } from '@/api/professionals';
import { useMyProfessionalProfile } from './use-professional-profile';

const POSITION_UPDATE_INTERVAL_MS = 30_000;
const MIN_DISTANCE_THRESHOLD_METERS = 50;

export function useLocationTracking(enabled = true) {
  const { data: profile } = useMyProfessionalProfile();
  const professionalId = profile?.id;
  const lastPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, latitude, longitude }: { id: string; latitude: number; longitude: number }) => {
      return professionalsApi.updatePosition(id, latitude, longitude);
    },
  });

  const sendPosition = useCallback(async () => {
    if (!professionalId) return;

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newLat = position.coords.latitude;
      const newLng = position.coords.longitude;

      if (lastPositionRef.current) {
        const distance = getDistanceMeters(
          lastPositionRef.current.latitude,
          lastPositionRef.current.longitude,
          newLat,
          newLng,
        );
        if (distance < MIN_DISTANCE_THRESHOLD_METERS) return;
      }

      lastPositionRef.current = { latitude: newLat, longitude: newLng };
      updatePositionMutation.mutate({ id: professionalId, latitude: newLat, longitude: newLng });
    } catch {
      // Silently fail — position tracking is best-effort
    }
  }, [professionalId, updatePositionMutation]);

  useEffect(() => {
    if (!enabled || !professionalId) return;

    sendPosition();

    intervalRef.current = setInterval(sendPosition, POSITION_UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, professionalId, sendPosition]);

  return {
    isTracking: enabled && !!professionalId,
    lastUpdate: lastPositionRef.current,
  };
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
