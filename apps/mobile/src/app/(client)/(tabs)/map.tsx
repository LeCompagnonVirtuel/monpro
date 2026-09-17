import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
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
import { MonproMapView, ProfessionalMarker, LocationButton, MapFiltersPanel, ProfessionalSheet, MapCircle } from '@/components/map';
import { useLocation } from '@/hooks/use-location';
import { useProfessionals } from '@/hooks/use-professionals';
import { messages } from '@/constants/messages';
import { addressesApi, Address } from '@/api/addresses';
import { useQuery } from '@tanstack/react-query';
import type { Professional } from '@/api/professionals';

export default function ClientMapScreen() {
  const { location, isLoading: locationLoading, error: locationError, refresh: refreshLocation } = useLocation();
  const [center, setCenter] = useState<[number, number] | undefined>(
    location ? [location.longitude, location.latitude] : undefined
  );
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [highlightedProId, setHighlightedProId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ radiusKm: 10, verifiedOnly: false, availableOnly: false, minRating: 0 });
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const flatListRef = useRef<FlatList>(null);

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await addressesApi.list();
      return data.data;
    },
  });

  useEffect(() => {
    if (location && !center) {
      setCenter([location.longitude, location.latitude]);
    }
  }, [location]);

  const queryLatitude = selectedAddress?.latitude || center?.[1] || location?.latitude;
  const queryLongitude = selectedAddress?.longitude || center?.[0] || location?.longitude;

  const { data: profData, isLoading, error, refetch, isRefetching } = useProfessionals({
    latitude: queryLatitude,
    longitude: queryLongitude,
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
      setCenter([location.longitude, location.latitude]);
      setSelectedAddress(null);
    }
  }, [refreshLocation, location]);

  const handleMarkerPress = useCallback((pro: Professional) => {
    setSelectedPro(pro);
    setHighlightedProId(pro.id);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleListItemPress = useCallback((pro: Professional) => {
    setSelectedPro(pro);
    setHighlightedProId(pro.id);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleViewProfile = useCallback(() => {
    if (selectedPro) {
      bottomSheetRef.current?.close();
      setHighlightedProId(null);
      router.push({ pathname: '/(client)/professional', params: { id: selectedPro.id } } as any);
    }
  }, [selectedPro]);

  const handleRequestService = useCallback(() => {
    if (selectedPro) {
      bottomSheetRef.current?.close();
      setHighlightedProId(null);
      router.push({ pathname: '/(client)/create-request', params: { professionalId: selectedPro.id } } as any);
    }
  }, [selectedPro]);

  const handleAddressSelect = useCallback((address: Address) => {
    setSelectedAddress(address);
    setShowAddressPicker(false);
    if (address.latitude && address.longitude) {
      setCenter([address.longitude, address.latitude]);
    }
  }, []);

  const renderProItem = useCallback(({ item }: { item: Professional }) => {
    const zone = item.zones?.[0];
    const isHighlighted = item.id === highlightedProId;
    return (
      <Pressable
        style={[styles.proCard, isHighlighted && styles.proCardHighlighted]}
        onPress={() => handleListItemPress(item)}
      >
        <View style={styles.proCardHeader}>
          <Text variant="bodySmall" numberOfLines={1} style={styles.proName}>
            {item.user?.fullName || 'Pro'}
          </Text>
          {item.verificationStatus === 'VERIFIED' && (
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          )}
        </View>
        {item.averageRating != null && (
          <View style={styles.proRating}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text variant="caption" color={colors.textSecondary}>{item.averageRating.toFixed(1)}</Text>
          </View>
        )}
      </Pressable>
    );
  }, [highlightedProId, handleListItemPress]);

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
          <Pressable onPress={() => setShowAddressPicker(true)} style={styles.addressPicker}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text variant="bodySmall" numberOfLines={1} style={styles.addressText}>
              {selectedAddress?.label || selectedAddress?.fullAddress || 'Ma position'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => setShowFilters(true)} style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.mapContainer}>
        <MonproMapView
          centerCoordinate={center}
          zoomLevel={13}
          onRegionChange={(coords) => setCenter([coords.longitude, coords.latitude])}
          showsUserLocation={!selectedAddress}
        >
          <MapCircle
            center={center || [-4.0083, 5.36]}
            radius={filters.radiusKm * 1000}
            color={colors.primary}
            opacity={0.08}
          />
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

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text variant="bodySmall" color={colors.textSecondary}>
            {proList.length} professionnel{proList.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <FlatList
          ref={flatListRef}
          data={proList}
          keyExtractor={(item) => item.id}
          renderItem={renderProItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyList}>
                <Ionicons name="people-outline" size={24} color={colors.textTertiary} />
                <Text variant="caption" color={colors.textTertiary}>Aucun pro trouvé</Text>
              </View>
            ) : null
          }
        />
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={[280]}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBg}
        handleIndicatorStyle={styles.handleIndicator}
        onClose={() => setHighlightedProId(null)}
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

      {showAddressPicker && (
        <View style={styles.filtersOverlay}>
          <Pressable style={styles.filtersBackdrop} onPress={() => setShowAddressPicker(false)} />
          <View style={styles.addressPickerSheet}>
            <View style={styles.handle} />
            <View style={styles.addressPickerHeader}>
              <Text variant="bodyMedium" style={{ fontWeight: '600' }}>Choisir une adresse</Text>
              <Pressable onPress={() => setShowAddressPicker(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Pressable
              style={[styles.addressItem, !selectedAddress && styles.addressItemActive]}
              onPress={handleRecenter}
            >
              <Ionicons name="locate-outline" size={20} color={!selectedAddress ? colors.primary : colors.textSecondary} />
              <View style={styles.addressItemText}>
                <Text variant="bodySmall" color={!selectedAddress ? colors.primary : colors.text}>
                  Ma position actuelle
                </Text>
              </View>
              {!selectedAddress && <Ionicons name="checkmark" size={16} color={colors.primary} />}
            </Pressable>
            {addresses?.map((addr) => (
              <Pressable
                key={addr.id}
                style={[styles.addressItem, selectedAddress?.id === addr.id && styles.addressItemActive]}
                onPress={() => handleAddressSelect(addr)}
              >
                <Ionicons
                  name={addr.label === 'Maison' ? 'home-outline' : addr.label === 'Bureau' ? 'briefcase-outline' : 'location-outline'}
                  size={20}
                  color={selectedAddress?.id === addr.id ? colors.primary : colors.textSecondary}
                />
                <View style={styles.addressItemText}>
                  <Text variant="bodySmall" color={selectedAddress?.id === addr.id ? colors.primary : colors.text}>
                    {addr.label || addr.fullAddress}
                  </Text>
                  {addr.label && (
                    <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      {addr.fullAddress}
                    </Text>
                  )}
                </View>
                {selectedAddress?.id === addr.id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </Pressable>
            ))}
          </View>
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
  addressPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  addressText: { flex: 1 },
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
  listContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    maxHeight: 100,
  },
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  proCard: {
    width: 160,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  proCardHighlighted: {
    borderColor: colors.primary,
    backgroundColor: colors.goldTint,
  },
  proCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  proName: { flex: 1, fontWeight: '600' },
  proRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  bottomSheetBg: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  handleIndicator: { backgroundColor: colors.border, width: 36 },
  filtersOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 },
  filtersBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  addressPickerSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '60%',
    paddingBottom: spacing.xl,
    ...shadows.lg,
  },
  addressPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addressItemActive: {
    backgroundColor: colors.goldTint,
  },
  addressItemText: {
    flex: 1,
  },
});
