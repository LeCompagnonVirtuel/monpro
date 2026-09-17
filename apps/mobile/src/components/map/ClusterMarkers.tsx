import { useMapMarker } from './MonproMapView';

interface ClusterPoint {
  id: string;
  coordinates: [number, number];
}

interface ClusterMarkersProps {
  points: ClusterPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

let clusterCounter = 0;

export function ClusterMarkers({ points, selectedId, onSelect }: ClusterMarkersProps) {
  return null;
}
