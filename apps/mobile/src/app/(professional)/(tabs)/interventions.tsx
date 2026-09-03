import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { useProfessionalBookings } from '@/hooks/use-professional-bookings';
import { Booking } from '@/api/bookings';
import { formatDate, formatCurrency } from '@/lib/format';
import { useMemo } from 'react';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  CONFIRMED: { color: colors.info, label: 'Confirmée', icon: 'checkmark-circle-outline' },
  ARRIVING: { color: colors.warning, label: 'En route', icon: 'navigate-outline' },
  IN_PROGRESS: { color: colors.primary, label: 'En cours', icon: 'construct-outline' },
  COMPLETED: { color: colors.success, label: 'Terminée', icon: 'checkmark-done-outline' },
  CANCELLED: { color: colors.error, label: 'Annulée', icon: 'close-circle-outline' },
};

const ACTIVE_STATUSES = ['CONFIRMED', 'ARRIVING', 'IN_PROGRESS'];
const COMPLETED_STATUSES = ['COMPLETED'];

export default function InterventionsScreen() {
  const { data: profile } = useMyProfessionalProfile();
  const { data, isLoading, error, refetch } = useProfessionalBookings(profile?.id);

  const { activeBookings, completedBookings } = useMemo(() => {
    const bookings = data?.bookings || [];
    return {
      activeBookings: bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)),
      completedBookings: bookings.filter((b) => COMPLETED_STATUSES.includes(b.status)),
    };
  }, [data]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Interventions</Text>
        </View>
        <View style={styles.loadingContent}>
          {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={80} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Interventions</Text>
        </View>
        <ErrorState message="Impossible de charger les interventions" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const allBookings = [...activeBookings, ...completedBookings];

  if (allBookings.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Interventions</Text>
        </View>
        <EmptyState title="Aucune intervention" description="Vos interventions apparaîtront ici après acceptation de vos devis." icon="construct-outline" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h2">Interventions</Text>
        <Text variant="bodySmall" color={colors.textSecondary}>{allBookings.length} au total</Text>
      </View>
      <FlatList
        data={allBookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingCard booking={item} />}
        contentContainerStyle={styles.listContent}
        onRefresh={refetch}
        refreshing={allBookings === undefined}
        ListHeaderComponent={activeBookings.length > 0 ? (
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={16} color={colors.warning} />
            <Text variant="bodyMedium" color={colors.warning}>En cours ({activeBookings.length})</Text>
          </View>
        ) : null}
        ListFooterComponent={completedBookings.length > 0 ? (
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-done-outline" size={16} color={colors.success} />
            <Text variant="bodyMedium" color={colors.success}>Terminées ({completedBookings.length})</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/(professional)/booking-detail', params: { bookingId: booking.id } })}
      accessibilityLabel={`Intervention ${config.label}, ${formatDate(booking.scheduledDate)}`}
      accessibilityRole="button"
    >
      <View style={[styles.statusIcon, { backgroundColor: config.color + '15' }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>
      <View style={styles.cardContent}>
        <Text variant="bodyMedium">{booking.quote?.totalAmount ? formatCurrency(booking.quote.totalAmount) : 'Intervention'}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
          <Text variant="caption" color={colors.textSecondary}>{formatDate(booking.scheduledDate)}</Text>
          {booking.scheduledTime && (
            <>
              <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
              <Text variant="caption" color={colors.textSecondary}>{booking.scheduledTime}</Text>
            </>
          )}
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
        <Text variant="caption" color={config.color}>{config.label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.xs },
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.md, ...shadows.sm },
  statusIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, gap: spacing.xs },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
});
