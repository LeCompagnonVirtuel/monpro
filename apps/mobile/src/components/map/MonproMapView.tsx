import { useRef, useCallback, useEffect } from 'react';
import MapView, { PROVIDER_DEFAULT, Marker, Region } from 'react-native-maps';
import { StyleSheet, View, Platform } from 'react-native';
import { colors } from '@/theme/colors';

const PROVIDER = Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_DEFAULT;

interface MonproMapViewProps {
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  onRegionChange?: (region: Region) => void;
  children?: React.ReactNode;
  style?: object;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  followsUserLocation?: boolean;
}

export function MonproMapView({
  region,
  onRegionChange,
  children,
  style,
  showsUserLocation = true,
  followsUserLocation = false,
}: MonproMapViewProps) {
  const mapRef = useRef<MapView>(null);

  const defaultRegion = {
    latitude: 5.3600,
    longitude: -4.0083,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const currentRegion = region || defaultRegion;

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER}
      style={[styles.map, style]}
      initialRegion={{
        ...currentRegion,
        latitudeDelta: currentRegion.latitudeDelta || 0.05,
        longitudeDelta: currentRegion.longitudeDelta || 0.05,
      }}
      showsUserLocation={showsUserLocation}
      followsUserLocation={followsUserLocation}
      onRegionChangeComplete={onRegionChange}
      showsCompass={false}
      showsScale={false}
      toolbarEnabled={false}
      mapType="standard"
    >
      {children}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
