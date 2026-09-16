import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton } from '@/components/ui';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { MonproMapView, ProfessionalMarker, LocationButton, MapFiltersPanel, ProfessionalSheet } from '@/components/map';
import { useLocation } from '@/hooks/use-location';
import { useProfessionals } from '@/hooks/use-professionals';
import { messages } from '@/constants/messages';
import type { Professional } from '@/api/professionals';
import type { Region } from 'react-native-maps';

export default function ClientMapScreen() {
  const { location, isLoading: locationLoading, error: locationError, refresh: refreshLocation } = useLocation();
  const [region, setRegion] = useState<Region | undefined>(
    location ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 } : undefined
  );
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ radiusKm: 10, verifiedOnly: false, availableOnly: false, minRating: 0 });
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (location && !region) {
      setRegion({ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    }
  }, [location]);

  const { data: profData, isLoading, error, refetch, isRefetching } = useProfessionals({
    latitude: region?.latitude || location?.latitude,
    longitude: region?.longitude || location?.longitude,
    radiusKm: filters.radiusKm,
    verified: filters.verifiedOnly || undefined,
    available: filters.availableOnly || undefined,
    limit: 50,
  });

  const proList = useMemo(() => {
    if (!profData?.professionals) return [];
    let list = profData.professionals;
    if (filters.minRating > 0) {
      list = list.filter((p) => (p.averageRating ?? 0) >= filters.minRating);
    }
    return list;
  }, [profData?.professionals, filters.minRating]);

  const handleRecenter = useCallback(async () => {
    await refreshLocation();
    if (location) {
      setRegion({ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    }
  }, [refreshLocation, location]);

  const handleMarkerPress = useCallback((pro: Professional) => {
    setSelectedPro(pro);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleViewProfile = useCallback(() => {
    if (selectedPro) {
      bottomSheetRef.current?.close();
      router.push({ pathname: '/(client)/professional', params: { id: selectedPro.id } } as any);
    }
  }, [selectedPro]);

  const handleRequestService = useCallback(() => {
    if (selectedPro) {
      bottomSheetRef.current?.close();
      router.push({ pathname: '/(client)/create-request', params: { professionalId: selectedPro.id } } as any);
    }
  }, [selectedPro]);

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
          <Text variant="bodyMedium">Professionnels près de vous</Text>
          <Pressable onPress={() => setShowFilters(true)} style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.mapContainer}>
        <MonproMapView
          region={region}
          onRegionChange={setRegion}
          showsUserLocation
        >
          {proList.map((pro) => {
            const zone = pro.zones?.[0];
            if (!zone?.latitude || !zone?.longitude) return null;
            return (
              <ProfessionalMarker
                key={pro.id}
                latitude={zone.latitude}
                longitude={zone.longitude}
                avatarUrl={pro.user?.avatarUrl}
                fullName={pro.user?.fullName || 'Pro'}
                isAvailable={pro.isAvailable}
                isVerified={pro.verificationStatus === 'VERIFIED'}
                averageRating={pro.averageRating}
                onPress={() => handleMarkerPress(pro)}
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
        snapPoints={[280]}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBg}
        handleIndicatorStyle={styles.handleIndicator}
      >
        {selectedPro && (
          <ProfessionalSheet
            avatarUrl={selectedPro.user?.avatarUrl}
            fullName={selectedPro.user?.fullName || 'Pro'}
            isVerified={selectedPro.verificationStatus === 'VERIFIED'}
            isAvailable={selectedPro.isAvailable}
            averageRating={selectedPro.averageRating}
            totalReviews={selectedPro.totalReviews}
            serviceName={selectedPro.services?.[0]?.service?.name}
            districtName={selectedPro.zones?.[0]?.name}
            onViewProfile={handleViewProfile}
            onRequestService={handleRequestService}
          />
        )}
      </BottomSheet>

      {showFilters && (
        <View style={styles.filtersOverlay}>
          <Pressable style={styles.filtersBackdrop} onPress={() => setShowFilters(false)} />
          <MapFiltersPanel
            filters={filters}
            onApply={(f) => { setFilters(f); setShowFilters(false); }}
            onClose={() => setShowFilters(false)}
          />
        </View>
      )}
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
  filterBtn: { padding: spacing.xs },
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
  filtersOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 },
  filtersBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
});
