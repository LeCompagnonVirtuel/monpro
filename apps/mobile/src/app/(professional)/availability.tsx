import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Switch, Alert, Modal } from 'react-native';
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

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const DEFAULT_SLOTS: AvailabilitySlot[] = DAYS.map((_, i) => ({
  dayOfWeek: i,
  startTime: '08:00',
  endTime: '18:00',
  isActive: i < 5,
}));

interface TimePickerState {
  visible: boolean;
  dayOfWeek: number;
  field: 'startTime' | 'endTime';
  hour: string;
  minute: string;
}

export default function AvailabilityScreen() {
  const { data: profile, isLoading: profileLoading } = useMyProfessionalProfile();
  const { data: slots, isLoading: slotsLoading, isError, refetch } = useProfessionalAvailability(profile?.id);
  const setAvailability = useSetAvailability();

  const [localSlots, setLocalSlots] = useState<AvailabilitySlot[]>(DEFAULT_SLOTS);
  const [hasChanges, setHasChanges] = useState(false);
  const [timePicker, setTimePicker] = useState<TimePickerState>({ visible: false, dayOfWeek: 0, field: 'startTime', hour: '08', minute: '00' });

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

  const openTimePicker = useCallback((dayOfWeek: number, field: 'startTime' | 'endTime') => {
    const slot = localSlots.find((s) => s.dayOfWeek === dayOfWeek);
    const time = slot?.[field] || '08:00';
    const [hour, minute] = time.split(':');
    setTimePicker({ visible: true, dayOfWeek, field, hour, minute });
  }, [localSlots]);

  const confirmTimePicker = useCallback(() => {
    const newTime = `${timePicker.hour}:${timePicker.minute}`;
    setLocalSlots((prev) =>
      prev.map((s) => s.dayOfWeek === timePicker.dayOfWeek ? { ...s, [timePicker.field]: newTime } : s),
    );
    setTimePicker((prev) => ({ ...prev, visible: false }));
    setHasChanges(true);
  }, [timePicker]);

  const handleSave = useCallback(async () => {
    if (!profile) return;

    const invalidSlot = localSlots.find(
      (s) => s.isActive && s.startTime >= s.endTime,
    );
    if (invalidSlot) {
      Alert.alert(
        'Horaires invalides',
        `Pour ${DAYS[invalidSlot.dayOfWeek]}, l'heure de fin doit être après l'heure de début.`,
      );
      return;
    }

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
                <View style={styles.timeRow}>
                  <Pressable
                    onPress={() => openTimePicker(slot.dayOfWeek, 'startTime')}
                    style={styles.timeChip}
                    accessibilityLabel={`Heure de début : ${slot.startTime}`}
                    accessibilityRole="button"
                  >
                    <Text variant="caption" color={colors.primary}>{slot.startTime}</Text>
                  </Pressable>
                  <Text variant="caption" color={colors.textTertiary}>—</Text>
                  <Pressable
                    onPress={() => openTimePicker(slot.dayOfWeek, 'endTime')}
                    style={styles.timeChip}
                    accessibilityLabel={`Heure de fin : ${slot.endTime}`}
                    accessibilityRole="button"
                  >
                    <Text variant="caption" color={colors.primary}>{slot.endTime}</Text>
                  </Pressable>
                </View>
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

      <Modal visible={timePicker.visible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setTimePicker((prev) => ({ ...prev, visible: false }))}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text variant="h3">
                {timePicker.field === 'startTime' ? 'Heure de début' : 'Heure de fin'} — {DAYS[timePicker.dayOfWeek]}
              </Text>
              <Pressable onPress={() => setTimePicker((prev) => ({ ...prev, visible: false }))} accessibilityLabel="Fermer">
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <Text variant="caption" color={colors.textSecondary} align="center">Heure</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {HOURS.map((h) => (
                    <Pressable
                      key={h}
                      style={[styles.pickerItem, timePicker.hour === h && styles.pickerItemActive]}
                      onPress={() => setTimePicker((prev) => ({ ...prev, hour: h }))}
                    >
                      <Text variant="body" color={timePicker.hour === h ? colors.textInverse : colors.text}>{h}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <Text variant="h3" style={styles.pickerSeparator}>:</Text>

              <View style={styles.pickerColumn}>
                <Text variant="caption" color={colors.textSecondary} align="center">Minute</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {MINUTES.map((m) => (
                    <Pressable
                      key={m}
                      style={[styles.pickerItem, timePicker.minute === m && styles.pickerItemActive]}
                      onPress={() => setTimePicker((prev) => ({ ...prev, minute: m }))}
                    >
                      <Text variant="body" color={timePicker.minute === m ? colors.textInverse : colors.text}>{m}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Button title="Confirmer" onPress={confirmTimePicker} />
          </Pressable>
        </Pressable>
      </Modal>
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
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surfaceSecondary, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.xl },
  pickerColumn: { flex: 1, maxHeight: 200 },
  pickerScroll: { maxHeight: 180 },
  pickerItem: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, alignItems: 'center' },
  pickerItemActive: { backgroundColor: colors.primary },
  pickerSeparator: { marginTop: spacing.xl },
  // Skeleton
  skeletonContent: { padding: spacing.lg, gap: spacing.sm },
  skeletonCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, ...shadows.sm },
  skeletonCardInner: { flexDirection: 'row', alignItems: 'center' },
  skeletonText: { flex: 1, gap: spacing.sm },
});
