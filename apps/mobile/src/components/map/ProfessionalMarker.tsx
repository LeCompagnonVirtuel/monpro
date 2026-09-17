import { useMapMarker } from './MonproMapView';

interface ProfessionalMarkerProps {
  latitude: number;
  longitude: number;
  avatarUrl?: string;
  fullName: string;
  isAvailable?: boolean;
  isVerified?: boolean;
  averageRating?: number;
  onPress?: () => void;
}

let proCounter = 0;

export function ProfessionalMarker({
  latitude,
  longitude,
  avatarUrl,
  fullName,
  isAvailable = false,
  isVerified = false,
  averageRating,
  onPress,
}: ProfessionalMarkerProps) {
  const id = `pro-${latitude}-${longitude}-${++proCounter}`;

  useMapMarker(id, {
    latitude,
    longitude,
    type: 'professional',
    title: fullName,
    avatarUrl,
    isAvailable,
    isVerified,
    onPress,
  });

  return null;
}
