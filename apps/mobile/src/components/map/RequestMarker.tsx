import { useEffect } from 'react';
import { useMapMarker } from './MonproMapView';

interface RequestMarkerProps {
  latitude: number;
  longitude: number;
  categoryName?: string;
  urgency?: string;
  onPress?: () => void;
}

let requestCounter = 0;

export function RequestMarker({
  latitude,
  longitude,
  categoryName,
  urgency = 'NORMAL',
  onPress,
}: RequestMarkerProps) {
  const id = `req-${latitude}-${longitude}-${++requestCounter}`;

  useMapMarker(id, {
    latitude,
    longitude,
    type: 'request',
    categoryName: categoryName || '',
    urgency,
    onPress,
  });

  return null;
}
