import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapboxGL } from './MonproMapView';
import { colors } from '@/theme/colors';

interface ClusterPoint {
  id: string;
  coordinates: [number, number];
}

interface ClusterMarkersProps {
  points: ClusterPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function ClusterMarkers({ points, selectedId, onSelect }: ClusterMarkersProps) {
  const geojson: GeoJSON.FeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      id: p.id,
      properties: { id: p.id },
      geometry: { type: 'Point' as const, coordinates: p.coordinates },
    })),
  }), [points]);

  return (
    <MapboxGL.ShapeSource
      id="cluster-source"
      shape={geojson}
      cluster
      clusterRadius={50}
      clusterMaxZoomLevel={14}
    >
      <MapboxGL.CircleLayer
        id="clustered-points"
        filter={['has', 'point_count']}
        style={{
          circleRadius: [
            'step',
            ['get', 'point_count'],
            18, 10,
            24, 25,
            30, 50,
            36,
          ],
          circleColor: colors.primary,
          circleOpacity: 0.85,
          circleStrokeColor: colors.surface,
          circleStrokeWidth: 2,
        }}
      />
      <MapboxGL.SymbolLayer
        id="cluster-count"
        filter={['has', 'point_count']}
        style={{
          textField: ['get', 'point_count_abbreviated'],
          textSize: 12,
          textColor: colors.textInverse,
          textFont: ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
        }}
      />
      <MapboxGL.CircleLayer
        id="unclustered-points"
        filter={['!', ['has', 'point_count']]}
        style={{
          circleRadius: 7,
          circleColor: selectedId
            ? colors.secondary
            : colors.primary,
          circleOpacity: 0.9,
          circleStrokeColor: colors.surface,
          circleStrokeWidth: 2,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
