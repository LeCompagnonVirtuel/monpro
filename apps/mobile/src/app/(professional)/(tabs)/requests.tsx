import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable, TextInput, Modal } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useProfessionalRequests } from '@/hooks/use-professional-requests';
import { getErrorMessage } from '@/lib/api-errors';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { ServiceRequest, ServiceRequestStatus, UrgencyLevel } from '@/api/requests';
import { formatRelativeDate } from '@/lib/format';

type FilterTab = 'all' | 'new' | 'active' | 'done';

const STATUS_LABELS: Record<string, { color: string; label: string }> = {
  DRAFT: { color: colors.textTertiary, label: 'Brouillon' },
  SUBMITTED: { color: colors.info, label: 'Nouvelle' },
  MATCHING: { color: colors.warning, label: 'Recherche' },
  QUOTED: { color: colors.secondary, label: 'Devis' },
  ACCEPTED: { color: colors.success, label: 'Acceptée' },
  SCHEDULED: { color: colors.primary, label: 'Planifiée' },
  IN_PROGRESS: { color: colors.primary, label: 'En cours' },
  COMPLETED: { color: colors.success, label: 'Terminée' },
  CANCELLED: { color: colors.error, label: 'Annulée' },
  DISPUTED: { color: colors.error, label: 'Litige' },
};

const URGENCY_CONFIG: Record<string, { color: string; label: string }> = {
  LOW: { color: colors.textTertiary, label: 'Basse' },
  NORMAL: { color: colors.info, label: 'Normale' },
  HIGH: { color: colors.warning, label: 'Haute' },
  URGENT: { color: colors.error, label: 'Urgent' },
};

const ACTIONABLE_STATUSES: ServiceRequestStatus[] = ['SUBMITTED', 'MATCHING', 'QUOTED'];

function getLocationText(req: ServiceRequest): string | null {
  if (req.address?.fullAddress) return req.address.fullAddress;
  return null;
}

function getEmptyMessage(tab: FilterTab): { title: string; description: string } {
  switch (tab) {
    case 'new':
      return {
        title: 'Aucune nouvelle demande',
        description: 'Les nouvelles demandes correspondant à vos services apparaîtront ici.',
      };
    case 'active':
      return {
        title: 'Aucune demande en cours',
        description: 'Les demandes en cours de traitement apparaîtront ici.',
      };
    case 'done':
      return {
        title: 'Aucune demande traitée',
        description: 'Les demandes terminées ou annulées apparaîtront ici.',
      };
    default:
      return {
        title: 'Aucune demande',
        description: 'Les demandes correspondant à vos services apparaîtront ici.',
      };
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
    // active and done use multi-status client-side filtering
    return undefined;
  }, [filter]);

  const { data, isLoading, error, refetch, isRefetching } = useProfessionalRequests({
    status: statusParam,
    limit: 50,
  });

  const allRequests = useMemo(() => data?.requests || [], [data]);

  const displayRequests = useMemo(() => {
    let list = allRequests;

    // Client-side multi-status filtering for active/done tabs
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
        title: 'Configurez vos services',
        description: 'Ajoutez vos services pour recevoir des demandes pertinentes.',
        action: 'Gérer mes services',
        route: '/(professional)/services' as const,
      };
    }
    if (!hasZone) {
      return {
        icon: 'location-outline' as const,
        title: 'Définissez votre zone',
        description: 'Indiquez votre zone d\'intervention pour être trouvé par les clients proches.',
        action: 'Ma zone d\'intervention',
        route: '/(professional)/onboarding' as const,
      };
    }
    if (!isVerified) {
      return {
        icon: 'shield-checkmark-outline' as const,
        title: 'Profil en vérification',
        description: 'Votre profil est en cours de vérification. Vous recevrez des demandes une fois approuvé.',
        action: 'Voir mon profil',
        route: '/(professional)/(tabs)/profile' as const,
      };
    }
    return null;
  }, [hasServices, hasZone, isVerified]);

  const renderRequestCard = useCallback(({ item }: { item: ServiceRequest }) => (
    <RequestCard request={item} />
  ), []);

  const keyExtractor = useCallback((item: ServiceRequest) => item.id, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Skeleton width="40%" height={26} />
          <Skeleton width="60%" height={14} />
        </View>
        <View style={styles.tabsRow}>
          <Skeleton width="20%" height={32} borderRadius={radius.lg} />
          <Skeleton width="25%" height={32} borderRadius={radius.lg} />
          <Skeleton width="25%" height={32} borderRadius={radius.lg} />
          <Skeleton width="25%" height={32} borderRadius={radius.lg} />
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={180} borderRadius={radius.md} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState
          message={getErrorMessage(error, 'Impossible de charger les demandes.')}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="h2">Demandes</Text>
          <Text variant="bodySmall" color={colors.textSecondary}>
            Trouvez et répondez aux demandes de clients près de chez vous.
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setSearchVisible(!searchVisible)}
            accessibilityLabel="Rechercher des demandes"
            accessibilityRole="button"
          >
            <Ionicons name={searchVisible ? 'close-outline' : 'search-outline'} size={20} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setFilterModalVisible(true)}
            accessibilityLabel="Filtrer les demandes"
            accessibilityRole="button"
          >
            <Ionicons name="options-outline" size={20} color={colors.text} />
            {urgencyFilter && <View style={styles.filterDot} />}
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
            placeholder="Rechercher..."
            placeholderTextColor={colors.textTertiary}
            autoFocus
            accessibilityLabel="Rechercher des demandes"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} accessibilityLabel="Effacer la recherche">
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <FilterTabBtn label="Toutes" count={data?.total} active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterTabBtn label="Nouvelles" count={tabCounts.new} active={filter === 'new'} onPress={() => setFilter('new')} />
        <FilterTabBtn label="En cours" count={tabCounts.active} active={filter === 'active'} onPress={() => setFilter('active')} />
        <FilterTabBtn label="Traitées" count={tabCounts.done} active={filter === 'done'} onPress={() => setFilter('done')} />
      </View>

      {/* Profile completeness banner */}
      {showBanner && bannerConfig && (
        <View style={styles.banner}>
          <View style={styles.bannerIconWrap}>
            <Ionicons name={bannerConfig.icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.bannerContent}>
            <Text variant="bodyMedium">{bannerConfig.title}</Text>
            <Text variant="caption" color={colors.textSecondary}>{bannerConfig.description}</Text>
            <Pressable
              onPress={() => router.push(bannerConfig.route)}
              accessibilityLabel={bannerConfig.action}
              accessibilityRole="button"
            >
              <Text variant="bodySmall" color={colors.primary} style={styles.bannerLink}>{bannerConfig.action} →</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Request list */}
      {displayRequests.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title={getEmptyMessage(filter).title}
          description={getEmptyMessage(filter).description}
        />
      ) : (
        <FlatList
          data={displayRequests}
          keyExtractor={keyExtractor}
          renderItem={renderRequestCard}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isRefetching}
          showsVerticalScrollIndicator={false}
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
            <Text variant="h3" style={styles.modalTitle}>Filtrer par urgence</Text>
            <View style={styles.modalOptions}>
              <FilterOption label="Toutes" active={urgencyFilter === null} onPress={() => setUrgencyFilter(null)} />
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
              accessibilityLabel="Fermer"
              accessibilityRole="button"
            >
              <Text variant="buttonSmall" color={colors.textInverse}>Appliquer</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ──────────── SUB COMPONENTS ────────────

function FilterTabBtn({ label, count, active, onPress }: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      accessibilityLabel={`${label}${count !== undefined ? ` ${count}` : ''}`}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text variant="caption" color={active ? colors.primary : colors.textSecondary}>
        {label}{count !== undefined ? ` ${count}` : ''}
      </Text>
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
  const status = STATUS_LABELS[request.status];
  const locationText = getLocationText(request);
  const canAct = ACTIONABLE_STATUSES.includes(request.status);
  const hasImage = request.media && request.media.length > 0;

  const handleView = () => {
    router.push({ pathname: '/(professional)/request-detail', params: { id: request.id } });
  };

  const handleQuote = () => {
    router.push({
      pathname: '/(professional)/create-quote',
      params: { requestId: request.id, serviceName: request.service?.name || '' },
    });
  };

  return (
    <View style={styles.card}>
      {hasImage && (
        <Image
          source={{ uri: request.media![0].url }}
          style={styles.cardImage}
          contentFit="cover"
          accessibilityLabel={`Image de la demande ${request.title}`}
        />
      )}

      <View style={styles.cardBody}>
        {/* Title + urgency */}
        <View style={styles.cardTitleRow}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.cardTitle}>{request.title}</Text>
          <View style={[styles.urgencyBadge, { backgroundColor: urgency.color + '15' }]}>
            <Text variant="caption" color={urgency.color}>{urgency.label}</Text>
          </View>
        </View>

        {/* Service */}
        {request.service && (
          <Text variant="caption" color={colors.textSecondary}>{request.service.name}</Text>
        )}

        {/* Description */}
        {request.description ? (
          <Text variant="caption" color={colors.textTertiary} numberOfLines={2} style={styles.cardDescription}>
            {request.description}
          </Text>
        ) : null}

        {/* Client */}
        {request.client && (
          <View style={styles.cardClient}>
            <Avatar uri={request.client.avatarUrl} name={request.client.fullName} size={20} />
            <Text variant="caption" color={colors.textSecondary}>{request.client.fullName}</Text>
          </View>
        )}

        {/* Location + time */}
        <View style={styles.cardMeta}>
          {locationText ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
              <Text variant="caption" color={colors.textTertiary} numberOfLines={1}>{locationText}</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
            <Text variant="caption" color={colors.textTertiary}>{formatRelativeDate(request.createdAt)}</Text>
          </View>
        </View>

        {/* Status + action */}
        <View style={styles.cardFooter}>
          {status && (
            <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
              <Text variant="caption" color={status.color}>{status.label}</Text>
            </View>
          )}
          {canAct ? (
            <Pressable
              style={styles.viewBtn}
              onPress={handleQuote}
              accessibilityLabel="Créer un devis"
              accessibilityRole="button"
            >
              <Text variant="buttonSmall" color={colors.textInverse}>Voir et répondre</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.textInverse} />
            </Pressable>
          ) : (
            <Pressable
              style={styles.detailBtn}
              onPress={handleView}
              accessibilityLabel="Voir les détails"
              accessibilityRole="button"
            >
              <Text variant="bodySmall" color={colors.primary}>Détails</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
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
  headerLeft: { flex: 1, gap: spacing.xxs },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  tabActive: {
    backgroundColor: colors.primaryLight,
  },

  // Banner
  banner: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.infoLight,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  bannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: { flex: 1, gap: spacing.xxs },
  bannerLink: { fontWeight: '600', marginTop: spacing.xs },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surfaceSecondary,
  },
  cardBody: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitle: { flex: 1, fontWeight: '600' },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  cardDescription: { lineHeight: 18 },
  cardClient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
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
