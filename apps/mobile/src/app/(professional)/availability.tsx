import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Button, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { useProfessionalAvailability, useSetAvailability, AvailabilitySlot } from '@/hooks/use-professional-availability';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const DEFAULT_SLOTS: AvailabilitySlot[] = DAYS.map((_, i) => ({
  dayOfWeek: i,
  startTime: '08:00',
  endTime: '18:00',
  isActive: i < 5,
}));

export default function AvailabilityScreen() {
  const { data: profile, isLoading: profileLoading } = useMyProfessionalProfile();
  const { data: slots, isLoading: slotsLoading, isError, refetch } = useProfessionalAvailability(profile?.id);
  const setAvailability = useSetAvailability();

  const [localSlots, setLocalSlots] = useState<AvailabilitySlot[]>(DEFAULT_SLOTS);
  const [hasChanges, setHasChanges] = useState(false);

  const isLoading = profileLoading || slotsLoading;

  useEffect(() => {
    if (slots && slots.length > 0) {
      const merged = DAYS.map((_, i) => {
        const existing = slots.find((s) => s.dayOfWeek === i);
        return existing || { dayOfWeek: i, startTime: '08:00', endTime: '18:00', isActive: false };
      });
      setLocalSlots(merged);
    }
  }, [slots]);

  const toggleDay = useCallback((dayOfWeek: number) => {
    setLocalSlots((prev) =>
      prev.map((s) => s.dayOfWeek === dayOfWeek ? { ...s, isActive: !s.isActive } : s),
    );
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!profile) return;
    try {
      await setAvailability.mutateAsync({ professionalId: profile.id, slots: localSlots });
      setHasChanges(false);
      Alert.alert('Enregistré', 'Vos disponibilités ont été mises à jour.');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer vos disponibilités. Veuillez réessayer.');
    }
  }, [profile, localSlots, setAvailability]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.skeletonContent}>
          <Skeleton width="70%" height={16} />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonCardInner}>
                <View style={styles.skeletonText}>
                  <Skeleton width="40%" height={18} />
                  <Skeleton width="55%" height={14} />
                </View>
                <Skeleton width={44} height={24} borderRadius={12} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState
          message="Impossible de charger vos disponibilités."
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="bodySmall" color={colors.textSecondary}>
          Indiquez les jours où vous êtes disponible pour recevoir des demandes.
        </Text>

        {localSlots.map((slot) => (
          <View key={slot.dayOfWeek} style={styles.dayCard}>
            <View style={styles.dayInfo}>
              <Text variant="bodyMedium">{DAYS[slot.dayOfWeek]}</Text>
              {slot.isActive ? (
                <Text variant="caption" color={colors.success}>
                  {slot.startTime} — {slot.endTime}
                </Text>
              ) : (
                <Text variant="caption" color={colors.textTertiary}>Indisponible</Text>
              )}
            </View>
            <Switch
              value={slot.isActive}
              onValueChange={() => toggleDay(slot.dayOfWeek)}
              trackColor={{ false: colors.borderLight, true: colors.primary + '60' }}
              thumbColor={slot.isActive ? colors.primary : colors.textTertiary}
              accessibilityLabel={`${DAYS[slot.dayOfWeek]} : ${slot.isActive ? `disponible de ${slot.startTime} à ${slot.endTime}` : 'indisponible'}`}
              accessibilityRole="switch"
            />
          </View>
        ))}
      </ScrollView>

      {hasChanges && (
        <View style={styles.footer}>
          <Button
            title={setAvailability.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
            onPress={handleSave}
            disabled={setAvailability.isPending}
            loading={setAvailability.isPending}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Retour"
        accessibilityRole="button"
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Disponibilités</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxxl },
  dayCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 56, ...shadows.sm },
  dayInfo: { flex: 1, gap: 2 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  // Skeleton
  skeletonContent: { padding: spacing.lg, gap: spacing.sm },
  skeletonCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, ...shadows.sm },
  skeletonCardInner: { flexDirection: 'row', alignItems: 'center' },
  skeletonText: { flex: 1, gap: spacing.sm },
});
