import { StyleSheet, View, ScrollView, Pressable, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Button, Skeleton, Divider } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useIntervention, useConfirmIntervention } from '@/hooks/use-interventions';
import { useBooking } from '@/hooks/use-bookings';
import { formatDateTime } from '@/lib/format';

const INTERVENTION_STEPS = [
  { key: 'CREATED', label: 'Intervention créée', icon: 'document-text' as const },
  { key: 'ARRIVED', label: 'Professionnel arrivé', icon: 'location' as const },
  { key: 'IN_PROGRESS', label: 'Intervention en cours', icon: 'construct' as const },
  { key: 'COMPLETED', label: 'Intervention terminée', icon: 'checkmark-done' as const },
  { key: 'CONFIRMED', label: 'Confirmée par le client', icon: 'checkmark-circle' as const },
];

function getStepIndex(intervention: { arrivedAt?: string; startedAt?: string; completedAt?: string; confirmedAt?: string }) {
  if (intervention.confirmedAt) return 4;
  if (intervention.completedAt) return 3;
  if (intervention.startedAt) return 2;
  if (intervention.arrivedAt) return 1;
  return 0;
}

export default function InterventionScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: intervention, isLoading, error, refetch } = useIntervention(bookingId);
  const { data: booking } = useBooking(bookingId);
  const confirmMutation = useConfirmIntervention();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          <Skeleton width="100%" height={200} />
          <Skeleton width="100%" height={100} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message="Impossible de charger l'intervention" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (!intervention) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <EmptyState title="Aucune intervention en cours pour cette réservation." icon="construct-outline" />
      </SafeAreaView>
    );
  }

  const currentStep = getStepIndex(intervention);
  const isCompleted = !!intervention.completedAt;
  const isConfirmed = !!intervention.confirmedAt;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusBanner}>
          <Ionicons
            name={isConfirmed ? 'checkmark-circle' : isCompleted ? 'hourglass' : 'construct'}
            size={40}
            color={isConfirmed ? colors.success : isCompleted ? colors.warning : colors.primary}
          />
          <Text variant="h2" align="center">
            {isConfirmed ? 'Intervention confirmée' : isCompleted ? 'En attente de confirmation' : 'Intervention en cours'}
          </Text>
          {booking && (
            <Text variant="bodySmall" color={colors.textSecondary}>
              {booking.professional?.user?.fullName || booking.professional?.businessName}
            </Text>
          )}
        </View>

        <Divider />

        <View style={styles.timeline}>
          {INTERVENTION_STEPS.map((step, index) => {
            const isDone = index <= currentStep;
            const isCurrent = index === currentStep;
            const timestamp = getTimestampForStep(index, intervention);

            return (
              <View key={step.key} style={styles.timelineStep}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.dot, isDone && styles.dotDone, isCurrent && styles.dotCurrent]}>
                    {isDone && <Ionicons name={step.icon} size={14} color={isDone ? colors.textInverse : colors.textTertiary} />}
                  </View>
                  {index < INTERVENTION_STEPS.length - 1 && (
                    <View style={[styles.vLine, isDone && styles.vLineDone]} />
                  )}
                </View>
                <View style={styles.timelineRight}>
                  <Text variant="body" color={isDone ? colors.text : colors.textTertiary}>{step.label}</Text>
                  {timestamp && (
                    <Text variant="bodySmall" color={colors.textSecondary}>{formatDateTime(timestamp)}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {intervention.beforePhotos && intervention.beforePhotos.length > 0 && (
          <>
            <Divider />
            <View style={styles.photosSection}>
              <Text variant="h3">Photos avant</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photosRow}>
                  {intervention.beforePhotos.map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={styles.photo} />
                  ))}
                </View>
              </ScrollView>
            </View>
          </>
        )}

        {intervention.afterPhotos && intervention.afterPhotos.length > 0 && (
          <>
            <Divider />
            <View style={styles.photosSection}>
              <Text variant="h3">Photos après</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photosRow}>
                  {intervention.afterPhotos.map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={styles.photo} />
                  ))}
                </View>
              </ScrollView>
            </View>
          </>
        )}

        {intervention.completionNotes && (
          <>
            <Divider />
            <View style={styles.notesSection}>
              <Text variant="h3">Notes de fin</Text>
              <Text variant="body" color={colors.textSecondary}>{intervention.completionNotes}</Text>
            </View>
          </>
        )}

        {isCompleted && !isConfirmed && (
          <View style={styles.actions}>
            <Text variant="bodySmall" color={colors.textSecondary} align="center">
              {"Le professionnel a terminé l'intervention. Veuillez confirmer si tout est correct."}
            </Text>
            <Button
              title="Confirmer l'intervention"
              onPress={async () => {
                await confirmMutation.mutateAsync(bookingId);
                refetch();
              }}
              loading={confirmMutation.isPending}
              disabled={confirmMutation.isPending}
              size="lg"
            />
          </View>
        )}

        {isConfirmed && (
          <View style={styles.actions}>
            <Button
              title="Procéder au paiement"
              onPress={() => router.push({ pathname: '/(client)/payment', params: { bookingId } })}
              size="lg"
            />
            <Button
              title="Laisser un avis"
              onPress={() => router.push({ pathname: '/(client)/review', params: { bookingId } })}
              variant="outline"
              size="lg"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimestampForStep(index: number, intervention: { arrivedAt?: string; startedAt?: string; completedAt?: string; confirmedAt?: string; createdAt: string }) {
  switch (index) {
    case 0: return intervention.createdAt;
    case 1: return intervention.arrivedAt;
    case 2: return intervention.startedAt;
    case 3: return intervention.completedAt;
    case 4: return intervention.confirmedAt;
    default: return undefined;
  }
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Intervention</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.xl, gap: spacing.lg },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  statusBanner: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  timeline: { paddingVertical: spacing.lg },
  timelineStep: { flexDirection: 'row', minHeight: 56 },
  timelineLeft: { alignItems: 'center', width: 32 },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: colors.success },
  dotCurrent: { backgroundColor: colors.primary },
  vLine: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  vLineDone: { backgroundColor: colors.success },
  timelineRight: { marginLeft: spacing.md, flex: 1, gap: 2, paddingBottom: spacing.md },
  photosSection: { paddingVertical: spacing.lg, gap: spacing.md },
  photosRow: { flexDirection: 'row', gap: spacing.sm },
  photo: { width: 100, height: 100, borderRadius: radius.md },
  notesSection: { paddingVertical: spacing.lg, gap: spacing.md },
  actions: { paddingTop: spacing.xl, gap: spacing.md },
});
