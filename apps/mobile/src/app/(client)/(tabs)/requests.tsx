import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable, RefreshControl, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Badge, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useServiceRequests } from '@/hooks/use-service-requests';
import { getErrorMessage } from '@/lib/api-errors';
import { ServiceRequest, ServiceRequestStatus } from '@/api/requests';
import { formatRelativeDate } from '@/lib/format';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

const ACTIVE_STATUSES: ServiceRequestStatus[] = [
  'SUBMITTED', 'MATCHING', 'QUOTED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS',
];

const STATUS_LABELS: Partial<Record<ServiceRequestStatus, { label: string; color: string }>> = {
  DRAFT: { label: 'Brouillon', color: colors.textTertiary },
  SUBMITTED: { label: 'Envoyée', color: colors.info },
  MATCHING: { label: 'Recherche', color: colors.warning },
  QUOTED: { label: 'Devis reçu', color: colors.info },
  ACCEPTED: { label: 'Acceptée', color: colors.success },
  SCHEDULED: { label: 'Planifiée', color: colors.primary },
  IN_PROGRESS: { label: 'En cours', color: colors.warning },
  COMPLETED: { label: 'Terminée', color: colors.success },
  CANCELLED: { label: 'Annulée', color: colors.error },
  DISPUTED: { label: 'Litige', color: colors.error },
};

const URGENCY_CONFIG: Record<string, { color: string; label: string }> = {
  LOW: { color: colors.textTertiary, label: 'Basse' },
  NORMAL: { color: colors.success, label: 'Normal' },
  HIGH: { color: colors.warning, label: 'Haute' },
  URGENT: { color: colors.error, label: 'Urgent' },
};

export default function RequestsScreen() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch, isRefetching } = useServiceRequests();

  const allRequests = useMemo(() => data?.requests || [], [data]);

  const tabCounts = useMemo(() => {
    const all = allRequests.length;
    const active = allRequests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;
    const completed = allRequests.filter((r) => r.status === 'COMPLETED').length;
    const cancelled = allRequests.filter((r) => r.status === 'CANCELLED').length;
    return { all, active, completed, cancelled };
  }, [allRequests]);

  const filteredRequests = useMemo(() => {
    let list = allRequests;
    if (filter === 'active') {
      list = list.filter((r) => ACTIVE_STATUSES.includes(r.status));
    } else if (filter === 'completed') {
      list = list.filter((r) => r.status === 'COMPLETED');
    } else if (filter === 'cancelled') {
      list = list.filter((r) => r.status === 'CANCELLED');
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.service?.name?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allRequests, filter, searchQuery]);

  const renderItem = useCallback(({ item, index }: { item: ServiceRequest; index: number }) => (
    <RequestCard request={item} index={index} />
  ), []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Skeleton width="40%" height={26} />
            <Skeleton width="65%" height={14} />
          </View>
          <View style={styles.headerActions}>
            <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
            <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
          </View>
        </View>
        <View style={styles.tabsRow}>
          <Skeleton width="22%" height={32} borderRadius={radius.lg} />
          <Skeleton width="22%" height={32} borderRadius={radius.lg} />
          <Skeleton width="22%" height={32} borderRadius={radius.lg} />
          <Skeleton width="22%" height={32} borderRadius={radius.lg} />
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height={100} borderRadius={radius.md} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="h2">Mes demandes</Text>
          <Text variant="bodySmall" color={colors.textSecondary}>
            Suivez l'avancement de vos demandes de service.
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setSearchVisible(!searchVisible)}
            accessibilityLabel="Rechercher"
            accessibilityRole="button"
          >
            <Ionicons name={searchVisible ? 'close-outline' : 'search-outline'} size={20} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push('/(client)/create-request')}
            accessibilityLabel="Nouvelle demande"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={22} color={colors.textInverse} />
          </Pressable>
        </View>
      </View>

      {/* Search */}
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
            <Pressable onPress={() => setSearchQuery('')} accessibilityLabel="Effacer">
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <FilterTabBtn label="Toutes" count={tabCounts.all} active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterTabBtn label="En cours" count={tabCounts.active} active={filter === 'active'} onPress={() => setFilter('active')} />
        <FilterTabBtn label="Terminées" count={tabCounts.completed} active={filter === 'completed'} onPress={() => setFilter('completed')} />
        <FilterTabBtn label="Annulées" count={tabCounts.cancelled} active={filter === 'cancelled'} onPress={() => setFilter('cancelled')} />
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIconWrap}>
          <Ionicons name="document-text-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.bannerContent}>
          <Text variant="bodyMedium">Publiez une demande !</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Décrivez votre besoin et recevez des devis de professionnels vérifiés.
          </Text>
        </View>
      </View>

      {/* List */}
      {error ? (
        <ErrorState message={getErrorMessage(error, 'Impossible de charger vos demandes')} onRetry={refetch} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title={filter === 'all' ? 'Aucune demande' : `Aucune demande ${filter === 'active' ? 'en cours' : filter === 'completed' ? 'terminée' : 'annulée'}`}
          description={filter === 'all'
            ? "Vous n'avez pas encore créé de demande de service."
            : 'Aucune demande dans cette catégorie.'}
        />
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function FilterTabBtn({ label, count, active, onPress }: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      accessibilityLabel={`${label} ${count}`}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text variant="caption" color={active ? colors.primary : colors.textSecondary}>
        {label} {count}
      </Text>
    </Pressable>
  );
}

function RequestCard({ request, index }: { request: ServiceRequest; index: number }) {
  const statusInfo = STATUS_LABELS[request.status];
  const urgencyInfo = URGENCY_CONFIG[request.urgency];

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
      <Pressable
        style={styles.card}
        onPress={() => router.push({ pathname: '/(client)/request-detail', params: { id: request.id } })}
        accessibilityLabel={request.title}
        accessibilityRole="button"
      >
        <View style={styles.cardIconCol}>
          <Ionicons name="document-text" size={22} color={colors.primary} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text variant="bodyMedium" numberOfLines={1} style={styles.cardTitle}>{request.title}</Text>
            {urgencyInfo && request.urgency !== 'NORMAL' && (
              <View style={[styles.urgencyBadge, { backgroundColor: urgencyInfo.color + '15' }]}>
                <Ionicons name="flash" size={10} color={urgencyInfo.color} />
                <Text variant="caption" color={urgencyInfo.color}>{urgencyInfo.label}</Text>
              </View>
            )}
          </View>

          {request.service && (
            <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {request.service.name}
            </Text>
          )}

          {request.description && (
            <Text variant="caption" color={colors.textTertiary} numberOfLines={1}>
              {request.description}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <Text variant="caption" color={colors.textTertiary}>
              {formatRelativeDate(request.createdAt)}
            </Text>
            {statusInfo && (
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
                <Text variant="caption" color={statusInfo.color}>{statusInfo.label}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.cardChevron}>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
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

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardIconCol: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  cardBody: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitle: { flex: 1, fontWeight: '600' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  cardChevron: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
});
