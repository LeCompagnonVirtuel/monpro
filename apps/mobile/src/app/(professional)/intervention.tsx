import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Skeleton, Button } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useProfessionalIntervention, useMarkArrived, useStartIntervention, useCompleteIntervention } from '@/hooks/use-professional-interventions';
import { uploadsApi } from '@/api/uploads';
import { formatDate } from '@/lib/format';

const STEPS = [
  { key: 'created', label: 'Créée', icon: 'checkmark-circle-outline' as const },
  { key: 'arrived', label: 'Arrivé', icon: 'navigate-outline' as const },
  { key: 'started', label: 'En cours', icon: 'construct-outline' as const },
  { key: 'completed', label: 'Terminée', icon: 'checkmark-done-outline' as const },
  { key: 'confirmed', label: 'Confirmée', icon: 'shield-checkmark-outline' as const },
];

function getStep(intervention: { arrivedAt?: string; startedAt?: string; completedAt?: string; clientConfirmedAt?: string }) {
  if (intervention.clientConfirmedAt) return 4;
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
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const pickImages = async (type: 'before' | 'after') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorisez l\'accès à vos photos pour continuer.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      const files = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      }));

      const { data } = await uploadsApi.uploadImages(files, 'interventions');
      const urls = data.data.urls;

      if (type === 'before') {
        setBeforePhotos((prev) => [...prev, ...urls]);
      } else {
        setAfterPhotos((prev) => [...prev, ...urls]);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'uploader les photos.');
    } finally {
      setUploading(false);
    }
  };

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
      {
        text: 'Confirmer',
        onPress: async () => {
          try {
            await markArrived.mutateAsync(bookingId!);
          } catch {
            Alert.alert('Erreur', 'Impossible de confirmer votre arrivée. Veuillez réessayer.');
          }
        },
      },
    ]);
  };

  const handleStart = () => {
    if (beforePhotos.length === 0) {
      Alert.alert('Photos requises', 'Veuillez ajouter au moins une photo avant de démarrer l\'intervention.');
      return;
    }
    Alert.alert('Démarrer', "Démarrer l'intervention ?", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Démarrer',
        onPress: async () => {
          try {
            await startIntervention.mutateAsync({ bookingId: bookingId!, beforePhotos });
          } catch {
            Alert.alert('Erreur', 'Impossible de démarrer l\'intervention. Veuillez réessayer.');
          }
        },
      },
    ]);
  };

  const handleComplete = () => {
    if (afterPhotos.length === 0) {
      Alert.alert('Photos requises', 'Veuillez ajouter au moins une photo après pour terminer l\'intervention.');
      return;
    }
    Alert.alert('Terminer', "Marquer l'intervention comme terminée ?", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Terminer',
        onPress: async () => {
          try {
            await completeIntervention.mutateAsync({ bookingId: bookingId!, afterPhotos });
          } catch {
            Alert.alert('Erreur', 'Impossible de terminer l\'intervention. Veuillez réessayer.');
          }
        },
      },
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
                  {step.key === 'confirmed' && intervention.clientConfirmedAt && (
                    <Text variant="bodySmall" color={colors.textSecondary}>{formatDate(intervention.clientConfirmedAt)}</Text>
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

        {currentStep === 1 && (
          <View style={styles.photosSection}>
            <View style={styles.photosHeader}>
              <Text variant="h3">Photos avant intervention</Text>
              <Button
                title={uploading ? 'Upload...' : 'Ajouter'}
                onPress={() => pickImages('before')}
                variant="outline"
                size="sm"
                disabled={uploading}
              />
            </View>
            {beforePhotos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photosRow}>
                  {beforePhotos.map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={styles.photo} />
                  ))}
                </View>
              </ScrollView>
            ) : (
              <Text variant="bodySmall" color={colors.textSecondary}>
                Ajoutez des photos de l'état avant l'intervention
              </Text>
            )}
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.photosSection}>
            <View style={styles.photosHeader}>
              <Text variant="h3">Photos après intervention</Text>
              <Button
                title={uploading ? 'Upload...' : 'Ajouter'}
                onPress={() => pickImages('after')}
                variant="outline"
                size="sm"
                disabled={uploading}
              />
            </View>
            {afterPhotos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photosRow}>
                  {afterPhotos.map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={styles.photo} />
                  ))}
                </View>
              </ScrollView>
            ) : (
              <Text variant="bodySmall" color={colors.textSecondary}>
                Ajoutez des photos de l'état après l'intervention
              </Text>
            )}
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
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
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
  photosSection: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  photosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photosRow: { flexDirection: 'row', gap: spacing.sm },
  photo: { width: 100, height: 100, borderRadius: radius.md },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  completedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
