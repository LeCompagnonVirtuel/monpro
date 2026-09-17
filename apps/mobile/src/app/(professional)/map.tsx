import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { MonproMapView, RequestMarker, LocationButton, RequestSheet, MapCircle, MapboxGL } from '@/components/map';
import { useLocation } from '@/hooks/use-location';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { requestsApi } from '@/api/requests';
import { useQuery } from '@tanstack/react-query';

const URGENCY_OPTIONS = ['ALL', 'URGENT', 'HIGH', 'NORMAL', 'LOW'] as const;
const URGENCY_LABELS: Record<string, string> = {
  ALL: 'Toutes',
  URGENT: 'Urgent',
  HIGH: 'Haute',
  NORMAL: 'Normale',
  LOW: 'Basse',
};

export default function ProfessionalMapScreen() {
  const { location, isLoading: locationLoading, error: locationError, refresh: refreshLocation } = useLocation();
  const { data: profile } = useMyProfessionalProfile();
  const [center, setCenter] = useState<[number, number] | undefined>(
    location ? [location.longitude, location.latitude] : undefined
  );
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [highlightedRequestId, setHighlightedRequestId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const flatListRef = useRef<FlatList>(null);
  const mapCameraRef = useRef<MapboxGL.Camera>(null);

  useEffect(() => {
    if (location && !center) {
      setCenter([location.longitude, location.latitude]);
    }
  }, [location]);

  const { data: nearbyData, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['pro-nearby-requests', center?.[1], center?.[0]],
    queryFn: async () => {
      const { data } = await requestsApi.getNearby({
        latitude: center?.[1] || location?.latitude || 5.36,
        longitude: center?.[0] || location?.longitude || -4.008,
        radiusKm: 15,
        limit: 50,
      });
      return data.data;
    },
    enabled: !!profile && (!!center || !!location),
    staleTime: 2 * 60 * 1000,
  });

  const requestsList = useMemo(() => {
    const list = nearbyData || [];
    if (urgencyFilter === 'ALL') return list;
    return list.filter((r: any) => r.urgency === urgencyFilter);
  }, [nearbyData, urgencyFilter]);

  const handleRecenter = useCallback(async () => {
    await refreshLocation();
    if (location) {
      setCenter([location.longitude, location.latitude]);
    }
  }, [refreshLocation, location]);

  const handleMarkerPress = useCallback((req: any) => {
    setSelectedRequest(req);
    setHighlightedRequestId(req.id);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleListItemPress = useCallback((req: any) => {
    setSelectedRequest(req);
    setHighlightedRequestId(req.id);
    if (req.latitude && req.longitude) {
      mapCameraRef.current?.setCamera({
        centerCoordinate: [req.longitude, req.latitude],
        zoomLevel: 15,
        animationMode: 'flyTo',
        animationDuration: 500,
      });
    }
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleViewDetail = useCallback(() => {
    if (selectedRequest) {
      bottomSheetRef.current?.close();
      setHighlightedRequestId(null);
      router.push({ pathname: '/(professional)/request-detail', params: { id: selectedRequest.id } } as any);
    }
  }, [selectedRequest]);

  const handleCreateQuote = useCallback(() => {
    if (selectedRequest) {
      bottomSheetRef.current?.close();
      setHighlightedRequestId(null);
      router.push({ pathname: '/(professional)/create-quote', params: { serviceRequestId: selectedRequest.id } } as any);
    }
  }, [selectedRequest]);

  const renderRequestItem = useCallback(({ item }: { item: any }) => {
    const isHighlighted = item.id === highlightedRequestId;
    return (
      <Pressable
        style={[styles.requestCard, isHighlighted && styles.requestCardHighlighted]}
        onPress={() => handleListItemPress(item)}
      >
        <View style={styles.requestCardHeader}>
          <Text variant="bodySmall" numberOfLines={1} style={styles.requestTitle}>
            {item.title}
          </Text>
          {item.urgency && item.urgency !== 'NORMAL' && (
            <View style={[styles.urgencyBadge, { backgroundColor: item.urgency === 'URGENT' ? colors.error + '20' : colors.warning + '20' }]}>
              <Text variant="caption" color={item.urgency === 'URGENT' ? colors.error : colors.warning}>
                {item.urgency === 'URGENT' ? 'Urgent' : item.urgency === 'HIGH' ? 'Haute' : item.urgency}
              </Text>
            </View>
          )}
        </View>
        {item.categoryName && (
          <Text variant="caption" color={colors.textSecondary}>{item.categoryName}</Text>
        )}
        {item.distanceKm != null && (
          <Text variant="caption" color={colors.textSecondary}>{item.distanceKm.toFixed(1)} km</Text>
        )}
      </Pressable>
    );
  }, [highlightedRequestId, handleListItemPress]);

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
            <Pressable onPress={() => setShowFilters(true)} style={styles.filterBtn}>
              <Ionicons name="options-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.mapContainer}>
        <MonproMapView
          centerCoordinate={center}
          zoomLevel={13}
          onRegionChange={(coords) => setCenter([coords.longitude, coords.latitude])}
          showsUserLocation
        >
          <MapCircle
            center={center || [-4.0083, 5.36]}
            radius={15000}
            color={colors.primary}
            opacity={0.06}
          />
          {requestsList.map((req: any) => {
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

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text variant="bodySmall" color={colors.textSecondary}>
            {requestsList.length} demande{requestsList.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <FlatList
          ref={flatListRef}
          data={requestsList}
          keyExtractor={(item: any) => item.id}
          renderItem={renderRequestItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyList}>
                <Ionicons name="search-outline" size={24} color={colors.textTertiary} />
                <Text variant="caption" color={colors.textTertiary}>Aucune demande</Text>
              </View>
            ) : null
          }
        />
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={[300]}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBg}
        handleIndicatorStyle={styles.handleIndicator}
        onClose={() => setHighlightedRequestId(null)}
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

      {showFilters && (
        <View style={styles.filtersOverlay}>
          <Pressable style={styles.filtersBackdrop} onPress={() => setShowFilters(false)} />
          <View style={styles.filtersSheet}>
            <View style={styles.handle} />
            <View style={styles.filtersHeader}>
              <Text variant="bodyMedium" style={{ fontWeight: '600' }}>Filtres</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.filterSection}>
              <Text variant="caption" color={colors.textSecondary} style={styles.filterSectionTitle}>URGENCE</Text>
              <View style={styles.chipsRow}>
                {URGENCY_OPTIONS.map((u) => (
                  <Pressable
                    key={u}
                    style={[styles.chip, urgencyFilter === u && styles.chipActive]}
                    onPress={() => setUrgencyFilter(u)}
                  >
                    <Text variant="caption" color={urgencyFilter === u ? colors.primary : colors.textSecondary}>
                      {URGENCY_LABELS[u]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
  requestCard: {
    width: 180,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requestCardHighlighted: {
    borderColor: colors.primary,
    backgroundColor: colors.goldTint,
  },
  requestCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestTitle: { flex: 1, fontWeight: '600' },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
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
  filtersSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '40%',
    paddingBottom: spacing.xl,
    ...shadows.lg,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filterSection: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  filterSectionTitle: { letterSpacing: 0.5, marginBottom: spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.goldTint,
    borderColor: colors.primary,
  },
});
