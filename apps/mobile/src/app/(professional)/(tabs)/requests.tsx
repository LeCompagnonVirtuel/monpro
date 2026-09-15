import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable, TextInput, Modal, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useProfessionalRequests } from '@/hooks/use-professional-requests';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { ServiceRequest, ServiceRequestStatus, UrgencyLevel } from '@/api/requests';
import { formatRelativeDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/api-errors';
import { messages } from '@/constants/messages';

type FilterTab = 'all' | 'new' | 'active' | 'done';

const URGENCY_CONFIG: Record<string, { color: string; label: string }> = {
  LOW: { color: colors.textTertiary, label: messages.urgency.low },
  NORMAL: { color: colors.success, label: messages.urgency.normal },
  HIGH: { color: colors.warning, label: messages.urgency.high },
  URGENT: { color: colors.error, label: messages.urgency.urgent },
};

const ACTIONABLE_STATUSES: ServiceRequestStatus[] = ['SUBMITTED', 'MATCHING', 'QUOTED'];

function getLocationText(req: ServiceRequest): string | null {
  if (req.address?.fullAddress) return req.address.fullAddress;
  return null;
}

function getEmptyMessage(tab: FilterTab): { title: string; description: string } {
  switch (tab) {
    case 'new':
      return { title: messages.empty.noNewRequests, description: messages.professionalRequests.emptyNew };
    case 'active':
      return { title: messages.requests.emptyActive, description: messages.professionalRequests.emptyActive };
    case 'done':
      return { title: messages.requests.emptyCompleted, description: messages.professionalRequests.emptyProcessed };
    default:
      return { title: messages.empty.noRequests, description: messages.professionalRequests.emptyDefault };
  }
}

export default function ProfessionalRequestsScreen() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | null>(null);

  const { data: profile } = useMyProfessionalProfile();

  const hasServices = (profile?.services?.length ?? 0) > 0;
  const hasZone = (profile?.zones?.length ?? 0) > 0;
  const isVerified = profile?.verificationStatus === 'VERIFIED';

  const statusParam = useMemo((): ServiceRequestStatus | undefined => {
    if (filter === 'new') return 'SUBMITTED';
    return undefined;
  }, [filter]);

  const { data, isLoading, error, refetch, isRefetching } = useProfessionalRequests({
    status: statusParam,
    limit: 50,
    enabled: !!profile,
  });

  const allRequests = useMemo(() => data?.requests || [], [data]);

  const displayRequests = useMemo(() => {
    let list = allRequests;
    if (filter === 'active') {
      list = list.filter((r) => ['MATCHING', 'QUOTED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(r.status));
    } else if (filter === 'done') {
      list = list.filter((r) => ['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(r.status));
    }
    if (urgencyFilter) {
      list = list.filter((r) => r.urgency === urgencyFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.service?.name?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allRequests, filter, urgencyFilter, searchQuery]);

  const tabCounts = useMemo(() => ({
    all: data?.total ?? allRequests.length,
    new: allRequests.filter(r => r.status === 'SUBMITTED').length,
    active: allRequests.filter(r => ['MATCHING', 'QUOTED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(r.status)).length,
    done: allRequests.filter(r => ['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(r.status)).length,
  }), [allRequests, data?.total]);

  const showBanner = !hasServices || !hasZone || !isVerified;

  const bannerConfig = useMemo(() => {
    if (!hasServices) {
      return {
        icon: 'briefcase-outline' as const,
        title: messages.professionalRequests.configServices,
        description: messages.professionalRequests.configServicesDesc,
        route: '/(professional)/services' as const,
      };
    }
    if (!hasZone) {
      return {
        icon: 'location-outline' as const,
        title: messages.professionalRequests.setZone,
        description: messages.professionalRequests.setZoneDesc,
        route: '/(professional)/onboarding' as const,
      };
    }
    if (!isVerified) {
      return {
        icon: 'shield-checkmark-outline' as const,
        title: messages.professionalRequests.verificationPending,
        description: messages.professionalRequests.verificationPendingDesc,
        route: '/(professional)/(tabs)/profile' as const,
      };
    }
    return null;
  }, [hasServices, hasZone, isVerified]);

  const renderRequestCard = useCallback(({ item }: { item: ServiceRequest }) => (
    <RequestCard request={item} />
  ), []);

  const keyExtractor = useCallback((item: ServiceRequest) => item.id, []);

  const renderBanner = () => {
    if (!showBanner || !bannerConfig) return null;
    return (
      <Pressable
        style={styles.banner}
        onPress={() => router.push(bannerConfig.route)}
        accessibilityLabel={bannerConfig.title}
        accessibilityRole="button"
      >
        <View style={styles.bannerIconWrap}>
          <Ionicons name={bannerConfig.icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.bannerContent}>
          <Text variant="bodyMedium" style={styles.bannerTitle}>{bannerConfig.title}</Text>
          <Text variant="caption" color={colors.textSecondary}>{bannerConfig.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerWrap}>
          <Skeleton width="40%" height={26} />
          <Skeleton width="70%" height={14} />
        </View>
        <View style={styles.tabsRow}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} width={75} height={36} borderRadius={radius.full} />
          ))}
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={130} borderRadius={radius.lg} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState message={getErrorMessage(error, messages.errors.loadRequests)} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="h1" style={styles.headerTitle}>{messages.professionalRequests.title}</Text>
          <Text variant="bodySmall" color={colors.textSecondary}>
            {messages.professionalRequests.subtitle}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setSearchVisible(!searchVisible)}
            accessibilityLabel={messages.search.clear}
            accessibilityRole="button"
          >
            <Ionicons name={searchVisible ? 'close-outline' : 'search-outline'} size={22} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setFilterModalVisible(true)}
            accessibilityLabel={messages.search.filters}
            accessibilityRole="button"
          >
            <Ionicons name="funnel-outline" size={20} color={colors.text} />
            {urgencyFilter && (
              <View style={styles.filterBadge}>
                <Text variant="caption" color={colors.textInverse} style={styles.filterBadgeText}>1</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Search bar */}
      {searchVisible && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={messages.search.placeholder}
            placeholderTextColor={colors.textTertiary}
            autoFocus
            accessibilityLabel={messages.search.professionalPlaceholder}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} accessibilityLabel={messages.search.clear}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        <FilterTabBtn label={messages.professionalRequests.filterAll} count={tabCounts.all} active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterTabBtn label={messages.professionalRequests.filterNew} count={tabCounts.new} active={filter === 'new'} onPress={() => setFilter('new')} isNew />
        <FilterTabBtn label={messages.professionalRequests.filterActive} count={tabCounts.active} active={filter === 'active'} onPress={() => setFilter('active')} />
        <FilterTabBtn label={messages.professionalRequests.filterProcessed} count={tabCounts.done} active={filter === 'done'} onPress={() => setFilter('done')} />
      </ScrollView>

      {/* Banner */}
      {renderBanner()}

      {/* Request list */}
      {displayRequests.length === 0 ? (
        <EmptyState
          lottie={require('../../../../lotties/Settings.json')}
          title={getEmptyMessage(filter).title}
          description={getEmptyMessage(filter).description}
        />
      ) : (
        <FlatList
          data={displayRequests}
          keyExtractor={keyExtractor}
          renderItem={renderRequestCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        />
      )}

      {/* Filter modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text variant="h3" style={styles.modalTitle}>{messages.professionalRequests.filterUrgency}</Text>
            <View style={styles.modalOptions}>
              <FilterOption label={messages.professionalRequests.filterAll} active={urgencyFilter === null} onPress={() => setUrgencyFilter(null)} />
              {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => (
                <FilterOption
                  key={key}
                  label={cfg.label}
                  active={urgencyFilter === key}
                  onPress={() => setUrgencyFilter(key as UrgencyLevel)}
                  color={cfg.color}
                />
              ))}
            </View>
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setFilterModalVisible(false)}
              accessibilityLabel="Appliquer"
              accessibilityRole="button"
            >
              <Text variant="buttonSmall" color={colors.textInverse}>{messages.common.apply}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ──────────── SUB COMPONENTS ────────────

function FilterTabBtn({ label, count, active, onPress, isNew }: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
  isNew?: boolean;
}) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      accessibilityLabel={`${label}${count !== undefined ? ` ${count}` : ''}`}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text
        variant="bodySmall"
        color={active ? colors.textInverse : colors.text}
        style={styles.tabLabel}
      >
        {label}
      </Text>
      {isNew && !active && (count ?? 0) > 0 && <View style={styles.newDot} />}
      {count !== undefined && (
        <View style={[styles.tabCountBadge, active && styles.tabCountBadgeActive]}>
          <Text
            variant="caption"
            color={active ? colors.primary : colors.textSecondary}
            style={styles.tabCountText}
          >
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function FilterOption({ label, active, onPress, color }: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      style={[styles.filterOption, active && styles.filterOptionActive]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
    >
      {color && <View style={[styles.filterDotInline, { backgroundColor: color }]} />}
      <Text variant="bodyMedium" color={active ? colors.primary : colors.text}>{label}</Text>
      {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
    </Pressable>
  );
}

function RequestCard({ request }: { request: ServiceRequest }) {
  const urgency = URGENCY_CONFIG[request.urgency] || URGENCY_CONFIG.NORMAL;
  const locationText = getLocationText(request);
  const canAct = ACTIONABLE_STATUSES.includes(request.status);
  const hasImage = request.media && request.media.length > 0;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/(professional)/request-detail', params: { id: request.id } })}
      accessibilityLabel={`Demande : ${request.title}`}
      accessibilityRole="button"
    >
      {/* Thumbnail */}
      <View style={styles.cardThumb}>
        {hasImage ? (
          <Image
            source={{ uri: request.media![0].url }}
            style={styles.cardThumbImg}
            contentFit="cover"
          />
        ) : (
          <View style={styles.cardThumbPlaceholder}>
            <Ionicons name="image-outline" size={28} color={colors.textTertiary} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Title + urgency */}
        <View style={styles.cardTitleRow}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.cardTitle}>{request.title}</Text>
          <View style={[styles.urgencyBadge, { backgroundColor: urgency.color + '18' }]}>
            <Text variant="caption" color={urgency.color} style={styles.urgencyText}>{urgency.label}</Text>
          </View>
        </View>

        {/* Description */}
        {request.description ? (
          <Text variant="caption" color={colors.textSecondary} numberOfLines={2} style={styles.cardDescription}>
            {request.description}
          </Text>
        ) : null}

        {/* Meta: location + time */}
        <View style={styles.cardMeta}>
          {locationText && (
            <View style={styles.metaItem}>
              <Ionicons name="location" size={11} color={colors.success} />
              <Text variant="caption" color={colors.textTertiary} numberOfLines={1} style={styles.metaText}>{locationText}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={11} color={colors.textTertiary} />
            <Text variant="caption" color={colors.textTertiary}>{formatRelativeDate(request.createdAt)}</Text>
          </View>
        </View>

        {/* Action button */}
        {canAct && (
          <Pressable
            style={styles.viewBtn}
            onPress={() => router.push({
              pathname: '/(professional)/create-quote',
              params: { requestId: request.id, serviceName: request.service?.name || '' },
            })}
            accessibilityLabel={messages.professionalRequests.viewAndRespond}
            accessibilityRole="button"
          >
            <Text variant="caption" color={colors.textInverse} style={styles.viewBtnText}>{messages.professionalRequests.viewAndRespond}</Text>
            <Ionicons name="arrow-forward" size={12} color={colors.textInverse} />
          </Pressable>
        )}
      </View>

      {/* Heart icon */}
      <Pressable style={styles.heartBtn} accessibilityLabel="Sauvegarder" accessibilityRole="button">
        <Ionicons name="heart-outline" size={20} color={colors.textTertiary} />
      </Pressable>
    </Pressable>
  );
}

// ──────────── STYLES ────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  headerLeft: { flex: 1, gap: spacing.xxs },
  headerTitle: { letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: { fontSize: 9, fontWeight: '700' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: { fontWeight: '600' },
  tabCountBadge: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabCountBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabCountText: { fontSize: 11, fontWeight: '700' },
  newDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.infoLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: { flex: 1, gap: spacing.xxs },
  bannerTitle: { fontWeight: '600' },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },

  // Card — horizontal layout
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  cardThumb: {
    width: 105,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  cardThumbImg: {
    width: '100%',
    height: '100%',
  },
  cardThumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  cardContent: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.lg,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: { flex: 1, fontWeight: '700' },
  urgencyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  urgencyText: { fontSize: 10, fontWeight: '700' },
  cardDescription: { lineHeight: 18 },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xxs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: { maxWidth: 120 },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.xxs,
  },
  viewBtnText: { fontWeight: '700', fontSize: 11 },
  heartBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  modalTitle: { letterSpacing: -0.2 },
  modalOptions: { gap: spacing.xs },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  filterOptionActive: {
    backgroundColor: colors.primaryLight,
  },
  filterDotInline: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalCloseBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
});
