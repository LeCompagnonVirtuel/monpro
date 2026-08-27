import { StyleSheet, View, ScrollView, Pressable, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Skeleton, Button } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useProfessionalIntervention, useMarkArrived, useStartIntervention, useCompleteIntervention } from '@/hooks/use-professional-interventions';
import { formatDate } from '@/lib/format';

const STEPS = [
  { key: 'created', label: 'Créée', icon: 'checkmark-circle-outline' as const },
  { key: 'arrived', label: 'Arrivé', icon: 'navigate-outline' as const },
  { key: 'started', label: 'En cours', icon: 'construct-outline' as const },
  { key: 'completed', label: 'Terminée', icon: 'checkmark-done-outline' as const },
  { key: 'confirmed', label: 'Confirmée', icon: 'shield-checkmark-outline' as const },
];

function getStep(intervention: { arrivedAt?: string; startedAt?: string; completedAt?: string; confirmedAt?: string }) {
  if (intervention.confirmedAt) return 4;
  if (intervention.completedAt) return 3;
  if (intervention.startedAt) return 2;
  if (intervention.arrivedAt) return 1;
  return 0;
}

export default function ProfessionalInterventionScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: intervention, isLoading, error, refetch } = useProfessionalIntervention(bookingId);
  const markArrived = useMarkArrived();
  const startIntervention = useStartIntervention();
  const completeIntervention = useCompleteIntervention();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          <Skeleton width="100%" height={200} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !intervention) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message="Impossible de charger l'intervention" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const currentStep = getStep(intervention);

  const handleMarkArrived = () => {
    Alert.alert('Confirmer', 'Confirmer votre arrivée sur le lieu ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: () => markArrived.mutate(bookingId!) },
    ]);
  };

  const handleStart = () => {
    Alert.alert('Démarrer', "Démarrer l'intervention ?", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Démarrer', onPress: () => startIntervention.mutate({ bookingId: bookingId!, beforePhotos: [] }) },
    ]);
  };

  const handleComplete = () => {
    Alert.alert('Terminer', "Marquer l'intervention comme terminée ?", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Terminer', onPress: () => completeIntervention.mutate({ bookingId: bookingId!, afterPhotos: [] }) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.timeline}>
          {STEPS.map((step, index) => {
            const isDone = index <= currentStep;
            const isCurrent = index === currentStep;
            return (
              <View key={step.key} style={styles.timelineStep}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, isDone && styles.timelineDotDone, isCurrent && styles.timelineDotCurrent]}>
                    <Ionicons name={step.icon} size={16} color={isDone ? colors.textInverse : colors.textTertiary} />
                  </View>
                  {index < STEPS.length - 1 && (
                    <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text variant="body" color={isDone ? colors.text : colors.textTertiary}>{step.label}</Text>
                  {step.key === 'arrived' && intervention.arrivedAt && (
                    <Text variant="bodySmall" color={colors.textSecondary}>{formatDate(intervention.arrivedAt)}</Text>
                  )}
                  {step.key === 'started' && intervention.startedAt && (
                    <Text variant="bodySmall" color={colors.textSecondary}>{formatDate(intervention.startedAt)}</Text>
                  )}
                  {step.key === 'completed' && intervention.completedAt && (
                    <Text variant="bodySmall" color={colors.textSecondary}>{formatDate(intervention.completedAt)}</Text>
                  )}
                  {step.key === 'confirmed' && intervention.confirmedAt && (
                    <Text variant="bodySmall" color={colors.textSecondary}>{formatDate(intervention.confirmedAt)}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {intervention.completionNotes && (
          <View style={styles.notesSection}>
            <Text variant="bodySmall" color={colors.textSecondary}>Notes</Text>
            <Text variant="body">{intervention.completionNotes}</Text>
          </View>
        )}
      </ScrollView>

      {currentStep === 0 && (
        <View style={styles.footer}>
          <Button title={markArrived.isPending ? 'Envoi...' : 'Je suis arrivé'} onPress={handleMarkArrived} disabled={markArrived.isPending} />
        </View>
      )}

      {currentStep === 1 && (
        <View style={styles.footer}>
          <Button title={startIntervention.isPending ? 'Envoi...' : "Démarrer l'intervention"} onPress={handleStart} disabled={startIntervention.isPending} />
        </View>
      )}

      {currentStep === 2 && (
        <View style={styles.footer}>
          <Button title={completeIntervention.isPending ? 'Envoi...' : "Terminer l'intervention"} onPress={handleComplete} disabled={completeIntervention.isPending} />
        </View>
      )}

      {currentStep >= 3 && (
        <View style={styles.footer}>
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text variant="body" color={colors.success}>
              {currentStep === 4 ? 'Intervention confirmée par le client' : 'En attente de confirmation client'}
            </Text>
          </View>
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
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  content: { padding: spacing.lg, gap: spacing.lg },
  timeline: { gap: 0 },
  timelineStep: { flexDirection: 'row', minHeight: 60 },
  timelineLeft: { width: 40, alignItems: 'center' },
  timelineDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  timelineDotDone: { backgroundColor: colors.primary },
  timelineDotCurrent: { backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.primary + '40' },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.borderLight, marginVertical: 4 },
  timelineLineDone: { backgroundColor: colors.primary },
  timelineContent: { flex: 1, paddingLeft: spacing.md, paddingBottom: spacing.lg, gap: 2 },
  notesSection: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  completedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
