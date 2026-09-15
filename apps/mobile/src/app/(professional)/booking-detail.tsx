import { StyleSheet, View, ScrollView, Pressable, Alert, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton, Button } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useProfessionalBooking } from '@/hooks/use-professional-bookings';
import { getErrorMessage } from '@/lib/api-errors';
import { useCreateIntervention } from '@/hooks/use-professional-interventions';
import { formatDate, formatCurrency, formatRelativeDate } from '@/lib/format';
import { messages } from '@/constants/messages';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap; nextAction?: string }> = {
  PENDING: { color: colors.warning, label: messages.status.pending, icon: 'hourglass-outline' },
  CONFIRMED: { color: colors.info, label: messages.status.confirmed, icon: 'checkmark-circle-outline', nextAction: messages.intervention.startTitle },
  ARRIVING: { color: colors.warning, label: messages.status.enRoute, icon: 'navigate-outline', nextAction: messages.intervention.arrived },
  IN_PROGRESS: { color: colors.primary, label: messages.status.inProgress, icon: 'construct-outline', nextAction: messages.intervention.completeTitle },
  COMPLETED: { color: colors.success, label: messages.status.completed, icon: 'checkmark-done-outline' },
  CANCELLED: { color: colors.error, label: messages.status.cancelled, icon: 'close-circle-outline' },
};

export default function ProfessionalBookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, error, refetch, isRefetching } = useProfessionalBooking(bookingId);
  const createIntervention = useCreateIntervention();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          <Skeleton width="80%" height={24} />
          <Skeleton width="100%" height={80} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message={getErrorMessage(error, messages.errors.loadBooking)} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;

  const handleStartIntervention = async () => {
    try {
      await createIntervention.mutateAsync(booking.id);
      router.push({ pathname: '/(professional)/intervention', params: { bookingId: booking.id } });
    } catch {
      Alert.alert(messages.common.error, messages.errors.createIntervention);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusConfig.color + '10' }]}>
          <Ionicons name={statusConfig.icon} size={24} color={statusConfig.color} />
          <View style={styles.statusText}>
            <Text variant="bodyMedium" color={statusConfig.color}>{statusConfig.label}</Text>
            {statusConfig.nextAction && (
              <Text variant="caption" color={colors.textSecondary}>Prochaine action : {statusConfig.nextAction}</Text>
            )}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountCard}>
          <Text variant="caption" color={colors.textInverse}>{messages.booking.amountLabel}</Text>
          <Text variant="h1" color={colors.textInverse}>{formatCurrency(booking.totalAmount)}</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.detailInfo}>
              <Text variant="caption" color={colors.textSecondary}>{messages.booking.dateScheduled}</Text>
              <Text variant="bodyMedium">{formatDate(booking.scheduledDate)}</Text>
            </View>
          </View>

          {booking.scheduledTime && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text variant="caption" color={colors.textSecondary}>{messages.booking.time}</Text>
                <Text variant="bodyMedium">{booking.scheduledTime}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.detailInfo}>
              <Text variant="caption" color={colors.textSecondary}>{messages.booking.created}</Text>
              <Text variant="bodyMedium">{formatRelativeDate(booking.createdAt)}</Text>
            </View>
          </View>

          {booking.address?.fullAddress && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text variant="caption" color={colors.textSecondary}>{messages.booking.address}</Text>
                <Text variant="bodyMedium">{booking.address.fullAddress}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {booking.status === 'CONFIRMED' && (
        <View style={styles.footer}>
          <Button
            title={createIntervention.isPending ? messages.common.loading : `${messages.intervention.startTitle} ${messages.intervention.title.toLowerCase()}`}
            onPress={handleStartIntervention}
            disabled={createIntervention.isPending}
          />
        </View>
      )}

      {booking.status === 'ARRIVING' && (
        <View style={styles.footer}>
          <Button
            title={messages.intervention.arrived}
            onPress={() => router.push({ pathname: '/(professional)/intervention', params: { bookingId: booking.id } })}
          />
        </View>
      )}

      {booking.status === 'IN_PROGRESS' && (
        <View style={styles.footer}>
          <Button
            title={`${messages.intervention.completeTitle} ${messages.intervention.title.toLowerCase()}`}
            onPress={() => router.push({ pathname: '/(professional)/intervention', params: { bookingId: booking.id } })}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel={messages.common.back} accessibilityRole="button" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>{messages.booking.title}</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  content: { padding: spacing.lg, gap: spacing.lg },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md },
  statusText: { flex: 1, gap: 2 },
  amountCard: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  detailsCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadows.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  detailIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  detailInfo: { flex: 1, gap: 2 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
});
