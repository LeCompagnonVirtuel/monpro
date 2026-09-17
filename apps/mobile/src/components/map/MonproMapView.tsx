import { useRef, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { colors } from '@/theme/colors';

MapboxGL.setAccessToken(null);

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_CENTER: [number, number] = [-4.0083, 5.36];
const DEFAULT_ZOOM = 13;

const osmStyle: any = {
  version: 8,
  name: 'OSM',
  sources: {
    osm: {
      type: 'raster',
      tiles: [OSM_TILE_URL],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-layer',
      type: 'raster',
      source: 'osm',
    },
  ],
};

interface MonproMapViewProps {
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  onRegionChange?: (coords: { latitude: number; longitude: number; zoomLevel: number }) => void;
  children?: React.ReactNode;
  style?: object;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
}

export function MonproMapView({
  centerCoordinate,
  zoomLevel,
  onRegionChange,
  children,
  style,
  showsUserLocation = true,
  followsUserLocation = false,
}: MonproMapViewProps) {
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const mapRef = useRef<MapboxGL.MapView>(null);

  const center = centerCoordinate || DEFAULT_CENTER;
  const zoom = zoomLevel || DEFAULT_ZOOM;

  return (
    <View style={[styles.container, style]}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleJSON={JSON.stringify(osmStyle)}
        logoEnabled={false}
        attributionEnabled={true}
        onRegionDidChange={(event: any) => {
          if (onRegionChange && event.geometry) {
            const [lng, lat] = event.geometry.coordinates;
            const zoomLevel = event.properties?.zoomLevel || DEFAULT_ZOOM;
            onRegionChange({ latitude: lat, longitude: lng, zoomLevel });
          }
        }}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          centerCoordinate={center}
          zoomLevel={zoom}
          animationMode="flyTo"
          animationDuration={0}
        />
        {showsUserLocation && <MapboxGL.UserLocation visible={true} />}
        {children}
      </MapboxGL.MapView>
    </View>
  );
}

export { MapboxGL };

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    flex: 1,
  },
});
