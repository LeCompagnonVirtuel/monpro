import { MapboxGL } from './MonproMapView';

interface MapCircleProps {
  center: [number, number];
  radius: number;
  color?: string;
  opacity?: number;
}

export function MapCircle({
  center,
  radius,
  color = '#071F49',
  opacity = 0.12,
}: MapCircleProps) {
  const GeoJSON: GeoJSON.Geometry = {
    type: 'Point',
    coordinates: center,
  };

  const style: any = {
    fill: {
      fillColor: color,
      fillOpacity: opacity,
    },
    outline: {
      outlineColor: color,
      outlineWidth: 1.5,
      outlineOpacity: opacity + 0.15,
    },
  };

  return (
    <MapboxGL.ShapeSource
      id={`circle-source-${center[0]}-${center[1]}`}
      shape={GeoJSON}
    >
      <MapboxGL.CircleLayer
        id={`circle-layer-${center[0]}-${center[1]}`}
        style={{
          circleRadius: [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            0, 0,
            20, radius / 150,
          ],
          circleColor: color,
          circleOpacity: opacity,
          circleStrokeColor: color,
          circleStrokeWidth: 1.5,
          circleStrokeOpacity: opacity + 0.15,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
