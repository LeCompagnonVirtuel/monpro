import { useMapCircle } from './MonproMapView';

interface MapCircleProps {
  center: [number, number];
  radius: number;
  color?: string;
  opacity?: number;
}

let circleCounter = 0;

export function MapCircle({
  center,
  radius,
  color = '#071F49',
  opacity = 0.12,
}: MapCircleProps) {
  const id = `circle-${center[0]}-${center[1]}-${++circleCounter}`;

  useMapCircle(id, { center, radius, color, opacity });

  return null;
}
