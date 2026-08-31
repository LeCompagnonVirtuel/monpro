import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text, Badge, Button, Skeleton, Divider } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useBooking, useCreateBooking } from '@/hooks/use-bookings';
import { useQuotesForRequest } from '@/hooks/use-quotes';
import { BookingStatus, CreateBookingPayload } from '@/api/bookings';
import { formatCurrency, formatDate } from '@/lib/format';

const STATUS_LABELS: Record<BookingStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'error' }> = {
  PENDING: { label: 'En attente', variant: 'warning' },
  CONFIRMED: { label: 'Confirmée', variant: 'success' },
  ARRIVING: { label: 'En route', variant: 'info' },
  IN_PROGRESS: { label: 'En cours', variant: 'warning' },
  COMPLETED: { label: 'Terminée', variant: 'success' },
  CANCELLED: { label: 'Annulée', variant: 'error' },
  DISPUTED: { label: 'Litige', variant: 'error' },
};

export default function BookingDetailScreen() {
  const { bookingId, quoteId, requestId } = useLocalSearchParams<{ bookingId?: string; quoteId?: string; requestId?: string }>();
  const { data: booking, isLoading: bookingLoading, error: bookingError, refetch } = useBooking(bookingId);
  const { data: quotes } = useQuotesForRequest(requestId);
  const createBooking = useCreateBooking();
  const [creating, setCreating] = useState(false);

  const acceptedQuote = quotes?.find((q) => q.id === quoteId && q.status === 'ACCEPTED');

  if (bookingId && bookingLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          <Skeleton width="100%" height={80} />
          <Skeleton width="100%" height={150} />
        </View>
      </SafeAreaView>
    );
  }

  if (bookingId && (bookingError || !booking)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message="Réservation introuvable" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (booking) {
    const statusInfo = STATUS_LABELS[booking.status];
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.confirmationBanner}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text variant="h2" align="center">Réservation confirmée</Text>
            <Badge label={statusInfo.label} variant={statusInfo.variant} />
          </View>

          <Divider />

          <View style={styles.detailSection}>
            <DetailRow label="Référence" value={booking.id.slice(0, 8).toUpperCase()} />
            <DetailRow label="Professionnel" value={booking.professional?.user?.fullName || booking.professional?.businessName || '-'} />
            <DetailRow label="Date" value={formatDate(booking.scheduledDate)} />
            {booking.scheduledTime && <DetailRow label="Heure" value={booking.scheduledTime} />}
            <DetailRow label="Montant" value={formatCurrency(booking.totalAmount)} />
            <DetailRow label="Statut" value={statusInfo.label} />
          </View>

          <BookingTimeline status={booking.status} />

          <View style={styles.actions}>
            {booking.status === 'CONFIRMED' && (
              <Button
                title="Voir l'intervention"
                onPress={() => router.push({ pathname: '/(client)/intervention', params: { bookingId: booking.id } })}
                size="lg"
              />
            )}
            {(booking.status === 'IN_PROGRESS' || booking.status === 'ARRIVING') && (
              <Button
                title="Suivre l'intervention"
                onPress={() => router.push({ pathname: '/(client)/intervention', params: { bookingId: booking.id } })}
                size="lg"
              />
            )}
            {booking.status === 'COMPLETED' && (
              <>
                <Button
                  title="Procéder au paiement"
                  onPress={() => router.push({ pathname: '/(client)/payment', params: { bookingId: booking.id } })}
                  size="lg"
                />
                <Button
                  title="Laisser un avis"
                  onPress={() => router.push({ pathname: '/(client)/review', params: { bookingId: booking.id } })}
                  variant="outline"
                  size="lg"
                />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (acceptedQuote && !bookingId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.confirmationBanner}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text variant="h2" align="center">Devis accepté !</Text>
            <Text variant="body" color={colors.textSecondary} align="center">
              Créez maintenant une réservation avec ce professionnel.
            </Text>
          </View>

          <Divider />

          <View style={styles.detailSection}>
            <DetailRow label="Professionnel" value={acceptedQuote.professional?.businessName || acceptedQuote.professional?.user?.fullName || '-'} />
            <DetailRow label="Montant" value={formatCurrency(acceptedQuote.totalAmount)} />
            {acceptedQuote.estimatedDuration && (
              <DetailRow label="Délai" value={acceptedQuote.estimatedDuration} />
            )}
          </View>

          <View style={styles.actions}>
            <Button
              title="Créer la réservation"
              onPress={() => handleCreateBooking()}
              loading={creating}
              disabled={creating}
              size="lg"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ErrorState message="Données insuffisantes pour afficher la réservation" onRetry={() => router.back()} />
    </SafeAreaView>
  );

  async function handleCreateBooking() {
    if (!acceptedQuote) return;
    setCreating(true);
    try {
      const payload: CreateBookingPayload = {
        quoteId: acceptedQuote.id,
        scheduledDate: new Date().toISOString().split('T')[0],
      };
      const newBooking = await createBooking.mutateAsync(payload);
      router.replace({ pathname: '/(client)/booking-detail', params: { bookingId: newBooking.id } });
    } catch {
      Alert.alert('Erreur', 'Impossible de créer la réservation. Vérifiez votre connexion.');
    } finally {
      setCreating(false);
    }
  }
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="bodySmall" color={colors.textSecondary}>{label}</Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

function BookingTimeline({ status }: { status: BookingStatus }) {
  const steps: { key: BookingStatus; label: string }[] = [
    { key: 'CONFIRMED', label: 'Réservation confirmée' },
    { key: 'ARRIVING', label: 'Professionnel en route' },
    { key: 'IN_PROGRESS', label: 'Intervention en cours' },
    { key: 'COMPLETED', label: 'Intervention terminée' },
  ];

  const statusOrder: BookingStatus[] = ['PENDING', 'CONFIRMED', 'ARRIVING', 'IN_PROGRESS', 'COMPLETED'];
  const currentIndex = statusOrder.indexOf(status);

  return (
    <View style={styles.timeline}>
      {steps.map((step, index) => {
        const stepIndex = statusOrder.indexOf(step.key);
        const isDone = stepIndex <= currentIndex;
        const isCurrent = stepIndex === currentIndex;

        return (
          <View key={step.key} style={styles.timelineStep}>
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineDot, isDone && styles.timelineDotDone, isCurrent && styles.timelineDotCurrent]}>
                {isDone && !isCurrent && <Ionicons name="checkmark" size={12} color={colors.textInverse} />}
              </View>
              {index < steps.length - 1 && (
                <View style={[styles.timelineVLine, isDone && styles.timelineVLineDone]} />
              )}
            </View>
            <Text
              variant="bodySmall"
              color={isDone ? colors.text : colors.textTertiary}
              style={styles.timelineLabel}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.xl, gap: spacing.lg },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  confirmationBanner: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  detailSection: { paddingVertical: spacing.lg, gap: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { paddingTop: spacing.xl, gap: spacing.md },
  timeline: { paddingVertical: spacing.lg, paddingLeft: spacing.md },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 44 },
  timelineLeft: { alignItems: 'center', width: 24 },
  timelineDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  timelineDotDone: { backgroundColor: colors.success },
  timelineDotCurrent: { backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.primaryLight },
  timelineVLine: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  timelineVLineDone: { backgroundColor: colors.success },
  timelineLabel: { marginLeft: spacing.md, paddingTop: 2 },
});
