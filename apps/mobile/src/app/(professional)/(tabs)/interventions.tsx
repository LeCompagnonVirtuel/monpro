import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable, TextInput } from 'react-native';
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
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { useProfessionalBookings } from '@/hooks/use-professional-bookings';
import { Booking, BookingStatus } from '@/api/bookings';
import { formatCurrency, formatRelativeDate } from '@/lib/format';

type FilterTab = 'all' | 'upcoming' | 'active' | 'done';

function getErrorMessage(error: unknown): string {
  const err = error as { response?: { status?: number }; isAxiosError?: boolean; message?: string };
  if (err?.isAxiosError && !err?.response) {
    return 'Vérifiez votre connexion et réessayez.';
  }
  const status = err?.response?.status;
  if (status === 401) return 'Votre session a expiré. Veuillez vous reconnecter.';
  if (status === 403) return "Vous n'avez pas accès à ces interventions.";
  if (status === 404) return 'Aucune intervention trouvée.';
  if (status && status >= 500) return 'Le service est temporairement indisponible. Réessayez dans quelques instants.';
  return 'Impossible de charger vos interventions.';
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: colors.textTertiary, label: 'En attente' },
  CONFIRMED: { color: colors.info, label: 'Confirmée' },
  ARRIVING: { color: colors.warning, label: 'En route' },
  IN_PROGRESS: { color: colors.primary, label: 'En cours' },
  COMPLETED: { color: colors.success, label: 'Terminée' },
  CANCELLED: { color: colors.error, label: 'Annulée' },
  DISPUTED: { color: colors.error, label: 'Litige' },
};

function getDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayKey(): string {
  return getDateKey(new Date().toISOString());
}

function getTomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getDateKey(d.toISOString());
}

function getWeekEndKey(): string {
  const d = new Date();
  const dayOfWeek = d.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  d.setDate(d.getDate() + daysUntilSunday);
  return getDateKey(d.toISOString());
}

function formatDayHeader(dateStr: string): string {
  const today = getTodayKey();
  const tomorrow = getTomorrowKey();
  const key = getDateKey(dateStr);

  if (key === today) return "Aujourd'hui";
  if (key === tomorrow) return 'Demain';

  const d = new Date(dateStr);
  const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
  const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function getLocationText(booking: Booking): string | null {
  if (booking.address?.fullAddress) return booking.address.fullAddress;
  return null;
}

function getEmptyMessage(tab: FilterTab): { title: string; description: string } {
  switch (tab) {
    case 'upcoming':
      return {
        title: 'Aucune intervention à venir',
        description: 'Vos interventions confirmées et planifiées apparaîtront ici.',
      };
    case 'active':
      return {
        title: 'Aucune intervention en cours',
        description: 'Les interventions en cours de réalisation apparaîtront ici.',
      };
    case 'done':
      return {
        title: 'Aucune intervention terminée',
        description: 'Vos interventions terminées apparaîtront ici.',
      };
    default:
      return {
        title: 'Aucune intervention',
        description: 'Vos interventions apparaîtront ici après acceptation de vos devis.',
      };
  }
}

export default function InterventionsScreen() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: profile } = useMyProfessionalProfile();

  const { data, isLoading, error, refetch, isRefetching } = useProfessionalBookings(profile?.id);

  const allBookings = useMemo(() => data?.bookings || [], [data]);

  const upcomingCount = useMemo(
    () => allBookings.filter((b) => ['PENDING', 'CONFIRMED'].includes(b.status)).length,
    [allBookings],
  );
  const activeCount = useMemo(
    () => allBookings.filter((b) => ['ARRIVING', 'IN_PROGRESS'].includes(b.status)).length,
    [allBookings],
  );
  const doneCount = useMemo(
    () => allBookings.filter((b) => b.status === 'COMPLETED').length,
    [allBookings],
  );

  const filteredBookings = useMemo(() => {
    let list = allBookings;
    if (filter === 'upcoming') {
      list = list.filter((b) => ['PENDING', 'CONFIRMED'].includes(b.status));
    } else if (filter === 'active') {
      list = list.filter((b) => ['ARRIVING', 'IN_PROGRESS'].includes(b.status));
    } else if (filter === 'done') {
      list = list.filter((b) => b.status === 'COMPLETED');
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.serviceRequest?.title?.toLowerCase().includes(q) ||
          b.serviceRequest?.service?.name?.toLowerCase().includes(q) ||
          b.serviceRequest?.client?.fullName?.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allBookings, filter, searchQuery]);

  const groupedBookings = useMemo(() => {
    if (filter === 'done') {
      return filteredBookings.length > 0
        ? [{ section: 'Terminées', data: filteredBookings }]
        : [];
    }

    const today = getTodayKey();
    const tomorrow = getTomorrowKey();
    const weekEnd = getWeekEndKey();

    const todayList: Booking[] = [];
    const tomorrowList: Booking[] = [];
    const weekList: Booking[] = [];
    const laterList: Booking[] = [];

    for (const b of filteredBookings) {
      const key = getDateKey(b.scheduledDate);
      if (key === today) {
        todayList.push(b);
      } else if (key === tomorrow) {
        tomorrowList.push(b);
      } else if (key > tomorrow && key <= weekEnd) {
        weekList.push(b);
      } else {
        laterList.push(b);
      }
    }

    const sections: { section: string; data: Booking[] }[] = [];
    if (todayList.length > 0) sections.push({ section: "Aujourd'hui", data: todayList });
    if (tomorrowList.length > 0) sections.push({ section: 'Demain', data: tomorrowList });
    if (weekList.length > 0) sections.push({ section: 'Cette semaine', data: weekList });
    if (laterList.length > 0) sections.push({ section: 'Plus tard', data: laterList });

    return sections;
  }, [filteredBookings, filter]);

  const flatData = useMemo(() => {
    const items: { type: 'header' | 'card'; data: string | Booking }[] = [];
    for (const section of groupedBookings) {
      items.push({ type: 'header', data: section.section });
      for (const booking of section.data) {
        items.push({ type: 'card', data: booking });
      }
    }
    return items;
  }, [groupedBookings]);

  const renderItem = useCallback(({ item }: { item: { type: 'header' | 'card'; data: string | Booking } }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text variant="bodyMedium" color={colors.primary}>{item.data as string}</Text>
        </View>
      );
    }
    return <InterventionCard booking={item.data as Booking} />;
  }, []);

  const keyExtractor = useCallback((item: { type: 'header' | 'card'; data: string | Booking }, index: number) => {
    if (item.type === 'header') return `section-${item.data}`;
    return (item.data as Booking).id;
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Skeleton width="40%" height={26} />
            <Skeleton width="70%" height={14} />
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
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={140} borderRadius={radius.md} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState
          message={getErrorMessage(error)}
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
          <Text variant="h2">Interventions</Text>
          <Text variant="bodySmall" color={colors.textSecondary}>
            Gérez vos interventions planifiées, en cours et terminées.
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
            accessibilityLabel="Rechercher des interventions"
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
        <FilterTabBtn label="Toutes" count={allBookings.length} active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterTabBtn label="À venir" count={upcomingCount} active={filter === 'upcoming'} onPress={() => setFilter('upcoming')} />
        <FilterTabBtn label="En cours" count={activeCount} active={filter === 'active'} onPress={() => setFilter('active')} />
        <FilterTabBtn label="Terminées" count={doneCount} active={filter === 'done'} onPress={() => setFilter('done')} />
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIconWrap}>
          <Ionicons name="calendar-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.bannerContent}>
          <Text variant="bodyMedium">Restez organisé !</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Consultez votre planning, préparez vos interventions et offrez un service de qualité à vos clients.
          </Text>
        </View>
      </View>

      {/* List */}
      {flatData.length === 0 ? (
        <EmptyState
          icon="construct-outline"
          title={getEmptyMessage(filter).title}
          description={getEmptyMessage(filter).description}
        />
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isRefetching}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ──────────── SUB COMPONENTS ────────────

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
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text variant="caption" color={active ? colors.primary : colors.textSecondary}>
        {label} {count}
      </Text>
    </Pressable>
  );
}

function InterventionCard({ booking }: { booking: Booking }) {
  const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
  const serviceName = booking.serviceRequest?.service?.name || 'Intervention';
  const clientName = booking.serviceRequest?.client?.fullName || '';
  const clientAvatar = booking.serviceRequest?.client?.avatarUrl;
  const locationText = getLocationText(booking);
  const hasImage = booking.serviceRequest?.media && booking.serviceRequest.media.length > 0;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/(professional)/booking-detail', params: { bookingId: booking.id } })}
      accessibilityLabel={`${serviceName}, ${config.label}`}
      accessibilityRole="button"
    >
      <View style={styles.cardTimeCol}>
        <Text variant="bodyMedium" color={colors.primary}>
          {booking.scheduledTime || '--:--'}
        </Text>
      </View>

      {hasImage && (
        <Image
          source={{ uri: booking.serviceRequest!.media![0].url }}
          style={styles.cardImage}
          contentFit="cover"
          accessibilityLabel={`Image de ${serviceName}`}
        />
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.cardTitle}>{serviceName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
            <Text variant="caption" color={config.color}>{config.label}</Text>
          </View>
        </View>

        {booking.serviceRequest?.title && booking.serviceRequest.title !== serviceName && (
          <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {booking.serviceRequest.title}
          </Text>
        )}

        {clientName ? (
          <View style={styles.cardClient}>
            <Avatar uri={clientAvatar} name={clientName} size={18} />
            <Text variant="caption" color={colors.textSecondary}>{clientName}</Text>
          </View>
        ) : null}

        {locationText ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
            <Text variant="caption" color={colors.textTertiary} numberOfLines={1}>{locationText}</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text variant="caption" color={colors.textTertiary}>
            #{booking.id.slice(0, 8).toUpperCase()}
          </Text>
          <Pressable
            style={styles.detailBtn}
            onPress={() => router.push({ pathname: '/(professional)/booking-detail', params: { bookingId: booking.id } })}
            accessibilityLabel="Voir les détails"
            accessibilityRole="button"
          >
            <Text variant="bodySmall" color={colors.primary}>Voir les détails</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </Pressable>
        </View>
      </View>
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

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardTimeCol: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.md,
  },
  cardImage: {
    width: 80,
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
  cardClient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
    marginTop: spacing.xxs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
});
