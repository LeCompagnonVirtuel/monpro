import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Skeleton, Button } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useProfessionalBooking } from '@/hooks/use-professional-bookings';
import { useCreateIntervention } from '@/hooks/use-professional-interventions';
import { formatDate, formatCurrency } from '@/lib/format';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: colors.warning, label: 'En attente' },
  CONFIRMED: { color: colors.info, label: 'Confirmée' },
  ARRIVING: { color: colors.warning, label: 'En route' },
  IN_PROGRESS: { color: colors.primary, label: 'En cours' },
  COMPLETED: { color: colors.success, label: 'Terminée' },
  CANCELLED: { color: colors.error, label: 'Annulée' },
};

export default function ProfessionalBookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, error, refetch } = useProfessionalBooking(bookingId);
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
        <ErrorState message="Impossible de charger la réservation" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;

  const handleStartIntervention = async () => {
    await createIntervention.mutateAsync(booking.id);
    router.push({ pathname: '/(professional)/intervention', params: { bookingId: booking.id } } as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
            <Text variant="body" color={statusConfig.color}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={styles.amountCard}>
          <Text variant="h2" color={colors.primary}>{formatCurrency(booking.totalAmount)}</Text>
          <Text variant="bodySmall" color={colors.textTertiary}>Montant</Text>
        </View>

        <View style={styles.infoSection}>
          <InfoRow label="Date prévue" value={formatDate(booking.scheduledDate)} />
          {booking.scheduledTime && <InfoRow label="Heure" value={booking.scheduledTime} />}
          <InfoRow label="Créée le" value={formatDate(booking.createdAt)} />
        </View>
      </ScrollView>

      {booking.status === 'CONFIRMED' && (
        <View style={styles.footer}>
          <Button
            title={createIntervention.isPending ? 'Création...' : "Démarrer l'intervention"}
            onPress={handleStartIntervention}
            disabled={createIntervention.isPending}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Réservation</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="bodySmall" color={colors.textSecondary}>{label}</Text>
      <Text variant="body">{value}</Text>
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
  statusSection: { alignItems: 'center' },
  statusBadge: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full },
  amountCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  infoSection: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  infoRow: { gap: 2 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
});
