import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Button, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { useProfessionalAvailability, useSetAvailability, AvailabilitySlot } from '@/hooks/use-professional-availability';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const DEFAULT_SLOTS: AvailabilitySlot[] = DAYS.map((_, i) => ({
  dayOfWeek: i + 1,
  startTime: '08:00',
  endTime: '18:00',
  isActive: i < 6,
}));

export default function AvailabilityScreen() {
  const { data: profile } = useMyProfessionalProfile();
  const { data: slots, isLoading, error, refetch } = useProfessionalAvailability(profile?.id);
  const setAvailability = useSetAvailability();

  const [localSlots, setLocalSlots] = useState<AvailabilitySlot[]>(DEFAULT_SLOTS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (slots && slots.length > 0) {
      setLocalSlots(slots);
    }
  }, [slots]);

  const toggleDay = (dayOfWeek: number) => {
    setLocalSlots((prev) =>
      prev.map((s) => s.dayOfWeek === dayOfWeek ? { ...s, isActive: !s.isActive } : s),
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    await setAvailability.mutateAsync({ professionalId: profile.id, slots: localSlots });
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} width="100%" height={50} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message="Impossible de charger les disponibilités" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        {localSlots.map((slot) => (
          <View key={slot.dayOfWeek} style={styles.dayRow}>
            <View style={styles.dayInfo}>
              <Text variant="body">{DAYS[slot.dayOfWeek - 1]}</Text>
              {slot.isActive && (
                <Text variant="bodySmall" color={colors.textSecondary}>
                  {slot.startTime} - {slot.endTime}
                </Text>
              )}
            </View>
            <Switch
              value={slot.isActive}
              onValueChange={() => toggleDay(slot.dayOfWeek)}
              trackColor={{ false: colors.borderLight, true: colors.primary + '60' }}
              thumbColor={slot.isActive ? colors.primary : colors.textTertiary}
              accessibilityLabel={`${DAYS[slot.dayOfWeek - 1]} ${slot.isActive ? 'actif' : 'inactif'}`}
            />
          </View>
        ))}
      </ScrollView>

      {hasChanges && (
        <View style={styles.footer}>
          <Button title={setAvailability.isPending ? 'Enregistrement...' : 'Enregistrer'} onPress={handleSave} disabled={setAvailability.isPending} />
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
      <Text variant="h3" style={styles.headerTitle}>Disponibilités</Text>
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
  content: { padding: spacing.lg, gap: spacing.sm },
  dayRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  dayInfo: { flex: 1, gap: 2 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
});
