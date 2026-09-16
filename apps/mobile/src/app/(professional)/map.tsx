import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text } from '@/components/ui';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { MonproMapView, RequestMarker, LocationButton, RequestSheet } from '@/components/map';
import { useLocation } from '@/hooks/use-location';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { requestsApi } from '@/api/requests';
import { useQuery } from '@tanstack/react-query';
import { messages } from '@/constants/messages';
import type { Region } from 'react-native-maps';

export default function ProfessionalMapScreen() {
  const { location, isLoading: locationLoading, error: locationError, refresh: refreshLocation } = useLocation();
  const { data: profile } = useMyProfessionalProfile();
  const [region, setRegion] = useState<Region | undefined>(
    location ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 } : undefined
  );
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (location && !region) {
      setRegion({ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    }
  }, [location]);

  const { data: nearbyData, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['pro-nearby-requests', region?.latitude, region?.longitude],
    queryFn: async () => {
      const { data } = await requestsApi.getNearby({
        latitude: region?.latitude || location?.latitude || 5.36,
        longitude: region?.longitude || location?.longitude || -4.008,
        radiusKm: 15,
        limit: 50,
      });
      return data.data;
    },
    enabled: !!profile && (!!region || !!location),
    staleTime: 2 * 60 * 1000,
  });

  const requestsList = useMemo(() => nearbyData || [], [nearbyData]);

  const handleRecenter = useCallback(async () => {
    await refreshLocation();
    if (location) {
      setRegion({ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    }
  }, [refreshLocation, location]);

  const handleMarkerPress = useCallback((req: any) => {
    setSelectedRequest(req);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleViewDetail = useCallback(() => {
    if (selectedRequest) {
      bottomSheetRef.current?.close();
      router.push({ pathname: '/(professional)/request-detail', params: { id: selectedRequest.id } } as any);
    }
  }, [selectedRequest]);

  const handleCreateQuote = useCallback(() => {
    if (selectedRequest) {
      bottomSheetRef.current?.close();
      router.push({ pathname: '/(professional)/create-quote', params: { serviceRequestId: selectedRequest.id } } as any);
    }
  }, [selectedRequest]);

  if (locationLoading && !location) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Carte" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.loadingText}>
            Localisation en cours...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (locationError && !location) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Carte" />
        <ErrorState
          message="Votre position n'est pas disponible."
          onRetry={handleRecenter}
        />
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <Text variant="bodyMedium">Demandes à proximité</Text>
          <View style={styles.headerRight}>
            <Text variant="caption" color={colors.textSecondary}>
              {requestsList.length} demande{requestsList.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.mapContainer}>
        <MonproMapView
          region={region}
          onRegionChange={setRegion}
          showsUserLocation
        >
          {requestsList.map((req) => {
            if (!req.latitude || !req.longitude) return null;
            return (
              <RequestMarker
                key={req.id}
                latitude={req.latitude}
                longitude={req.longitude}
                categoryName={req.categoryName}
                urgency={req.urgency}
                onPress={() => handleMarkerPress(req)}
              />
            );
          })}
        </MonproMapView>

        <LocationButton onPress={handleRecenter} isLoading={locationLoading} />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={[300]}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBg}
        handleIndicatorStyle={styles.handleIndicator}
      >
        {selectedRequest && (
          <RequestSheet
            title={selectedRequest.title}
            categoryName={selectedRequest.categoryName}
            districtName={selectedRequest.districtName}
            distanceKm={selectedRequest.distanceKm}
            createdAt={selectedRequest.createdAt}
            description={selectedRequest.description}
            urgency={selectedRequest.urgency}
            onViewDetail={handleViewDetail}
            onCreateQuote={handleCreateQuote}
          />
        )}
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerSafe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface + 'E6',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mapContainer: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { marginTop: spacing.sm },
  loadingOverlay: {
    position: 'absolute',
    top: spacing.xl + 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomSheetBg: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  handleIndicator: { backgroundColor: colors.border, width: 36 },
});
