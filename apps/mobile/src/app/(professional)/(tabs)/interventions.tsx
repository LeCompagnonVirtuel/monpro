import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { useProfessionalBookings } from '@/hooks/use-professional-bookings';
import { Booking } from '@/api/bookings';
import { formatDate, formatCurrency } from '@/lib/format';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  CONFIRMED: { color: colors.info, label: 'Confirmée', icon: 'checkmark-circle-outline' },
  ARRIVING: { color: colors.warning, label: 'En route', icon: 'navigate-outline' },
  IN_PROGRESS: { color: colors.primary, label: 'En cours', icon: 'construct-outline' },
  COMPLETED: { color: colors.success, label: 'Terminée', icon: 'checkmark-done-outline' },
  CANCELLED: { color: colors.error, label: 'Annulée', icon: 'close-circle-outline' },
};

export default function InterventionsScreen() {
  const { data: profile } = useMyProfessionalProfile();
  const { data, isLoading, error, refetch } = useProfessionalBookings(profile?.id);

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

  const bookings = data?.bookings || [];

  if (bookings.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Interventions</Text>
        </View>
        <EmptyState title="Aucune intervention prévue" description="Vos interventions apparaîtront ici après acceptation de vos devis." icon="construct-outline" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h2">Interventions</Text>
      </View>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingCard booking={item} />}
        contentContainerStyle={styles.listContent}
        onRefresh={refetch}
        refreshing={false}
      />
    </SafeAreaView>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/(professional)/intervention', params: { bookingId: booking.id } } as never)}
      accessibilityLabel={`Intervention ${config.label}`}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.statusIcon, { backgroundColor: config.color + '15' }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text variant="body" numberOfLines={1}>{booking.quote?.totalAmount ? formatCurrency(booking.quote.totalAmount) : '-'}</Text>
        <Text variant="bodySmall" color={colors.textSecondary}>{formatDate(booking.scheduledDate)}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
        <Text variant="bodySmall" color={config.color}>{config.label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  cardLeft: {},
  statusIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, gap: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
});
