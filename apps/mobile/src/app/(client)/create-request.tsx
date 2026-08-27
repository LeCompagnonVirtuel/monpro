import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Button, Input, Card } from '@/components/ui';
import { UrgencyLevel } from '@/api/requests';
import { uploadsApi } from '@/api/uploads';
import { useCreateServiceRequest } from '@/hooks/use-service-requests';
import { useService } from '@/hooks/use-services';
import { useLocation } from '@/hooks/use-location';
import { extractApiError } from '@/api/errors';

type WizardStep = 'description' | 'photos' | 'urgency' | 'date' | 'summary';

const URGENCY_OPTIONS: { value: UrgencyLevel; label: string; description: string }[] = [
  { value: 'LOW', label: 'Faible', description: 'Pas urgent, dans les prochaines semaines' },
  { value: 'NORMAL', label: 'Normale', description: 'Dans les prochains jours' },
  { value: 'HIGH', label: 'Élevée', description: "Dès que possible" },
  { value: 'URGENT', label: 'Urgente', description: "Aujourd'hui ou demain" },
];

const STEPS: WizardStep[] = ['description', 'photos', 'urgency', 'date', 'summary'];

export default function CreateRequestScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();
  const { data: service } = useService(serviceId);
  const { location } = useLocation();
  const createRequest = useCreateServiceRequest();

  const [step, setStep] = useState<WizardStep>('description');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [urgency, setUrgency] = useState<UrgencyLevel>('NORMAL');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeStart, setPreferredTimeStart] = useState('');
  const [preferredTimeEnd, setPreferredTimeEnd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(step);
  const isLastStep = stepIndex === STEPS.length - 1;

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1]);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1]);
    } else {
      router.back();
    }
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 5 - photos.length,
    });

    if (!result.canceled) {
      const newPhotos = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      }));
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!serviceId || !title.trim() || !description.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        const { data: uploadResponse } = await uploadsApi.uploadImages(photos, 'service-requests');
        photoUrls = uploadResponse.data.urls;
      }

      await createRequest.mutateAsync({
        serviceId,
        title: title.trim(),
        description: description.trim() + (photoUrls.length > 0 ? `\n\n[Photos: ${photoUrls.join(', ')}]` : ''),
        urgency,
        preferredDate: preferredDate || undefined,
        preferredTimeStart: preferredTimeStart || undefined,
        preferredTimeEnd: preferredTimeEnd || undefined,
      });

      router.replace('/(client)/requests');
    } catch (err) {
      const apiError = extractApiError(err);
      setError(apiError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'description':
        return title.trim().length >= 5 && description.trim().length >= 10;
      case 'photos':
        return true;
      case 'urgency':
        return true;
      case 'date':
        return true;
      case 'summary':
        return !isSubmitting;
      default:
        return true;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} accessibilityLabel="Retour" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="h3">Nouvelle demande</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.progressBar}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 'description' && (
          <View style={styles.stepContent}>
            <Text variant="h2">Décrivez votre besoin</Text>
            {service && (
              <Text variant="bodySmall" color={colors.textSecondary}>
                Service : {service.name}
              </Text>
            )}
            <Input
              label="Titre"
              placeholder="Ex: Réparation robinet cuisine"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              accessibilityLabel="Titre de la demande"
            />
            <View style={styles.textareaContainer}>
              <Text variant="bodySmall" color={colors.textSecondary}>Description</Text>
              <TextInput
                style={styles.textarea}
                placeholder="Décrivez en détail votre besoin..."
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={2000}
                textAlignVertical="top"
                accessibilityLabel="Description détaillée"
              />
              <Text variant="caption" color={colors.textTertiary} style={styles.charCount}>
                {description.length}/2000
              </Text>
            </View>
          </View>
        )}

        {step === 'photos' && (
          <View style={styles.stepContent}>
            <Text variant="h2">Photos (optionnel)</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Ajoutez des photos pour aider le professionnel à comprendre votre besoin.
            </Text>
            <View style={styles.photoGrid}>
              {photos.map((photo, i) => (
                <View key={i} style={styles.photoItem}>
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="image" size={24} color={colors.primary} />
                  </View>
                  <Pressable
                    style={styles.removePhotoBtn}
                    onPress={() => removePhoto(i)}
                    accessibilityLabel="Supprimer la photo"
                  >
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </Pressable>
                </View>
              ))}
              {photos.length < 5 && (
                <Pressable style={styles.addPhotoBtn} onPress={pickImages} accessibilityLabel="Ajouter des photos">
                  <Ionicons name="camera-outline" size={28} color={colors.primary} />
                  <Text variant="caption" color={colors.primary}>Ajouter</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {step === 'urgency' && (
          <View style={styles.stepContent}>
            <Text variant="h2">Niveau d{"'"}urgence</Text>
            <View style={styles.urgencyList}>
              {URGENCY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[styles.urgencyCard, urgency === option.value && styles.urgencyCardSelected]}
                  onPress={() => setUrgency(option.value)}
                  accessibilityLabel={`${option.label}: ${option.description}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: urgency === option.value }}
                >
                  <Text variant="body" color={urgency === option.value ? colors.primary : colors.text}>
                    {option.label}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {option.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 'date' && (
          <View style={styles.stepContent}>
            <Text variant="h2">Date souhaitée</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Optionnel — indiquez vos préférences de date et horaire.
            </Text>
            <Input
              label="Date préférée"
              placeholder="AAAA-MM-JJ (ex: 2026-09-01)"
              value={preferredDate}
              onChangeText={setPreferredDate}
              accessibilityLabel="Date préférée"
            />
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Input
                  label="Heure début"
                  placeholder="08:00"
                  value={preferredTimeStart}
                  onChangeText={setPreferredTimeStart}
                  accessibilityLabel="Heure de début"
                />
              </View>
              <View style={styles.timeField}>
                <Input
                  label="Heure fin"
                  placeholder="18:00"
                  value={preferredTimeEnd}
                  onChangeText={setPreferredTimeEnd}
                  accessibilityLabel="Heure de fin"
                />
              </View>
            </View>
          </View>
        )}

        {step === 'summary' && (
          <View style={styles.stepContent}>
            <Text variant="h2">Résumé</Text>
            <Card style={styles.summaryCard}>
              <SummaryRow label="Service" value={service?.name || 'Non spécifié'} />
              <SummaryRow label="Titre" value={title} />
              <SummaryRow label="Description" value={description.slice(0, 100) + (description.length > 100 ? '...' : '')} />
              <SummaryRow label="Photos" value={`${photos.length} photo(s)`} />
              <SummaryRow label="Urgence" value={URGENCY_OPTIONS.find(o => o.value === urgency)?.label || urgency} />
              {preferredDate && <SummaryRow label="Date" value={preferredDate} />}
              {preferredTimeStart && <SummaryRow label="Horaire" value={`${preferredTimeStart} - ${preferredTimeEnd}`} />}
              <SummaryRow label="Localisation" value={location ? 'Position GPS fournie' : 'Non disponible'} />
            </Card>
            {error && (
              <Text variant="bodySmall" color={colors.error}>{error}</Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {isLastStep ? (
          <Button
            title="Envoyer ma demande"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!canProceed()}
            size="lg"
          />
        ) : (
          <Button
            title="Continuer"
            onPress={goNext}
            disabled={!canProceed()}
            size="lg"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text variant="bodySmall" numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  stepContent: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  textareaContainer: {
    gap: spacing.xs,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 120,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  charCount: {
    textAlign: 'right',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  photoItem: {
    position: 'relative',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  urgencyList: {
    gap: spacing.sm,
  },
  urgencyCard: {
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    gap: spacing.xxs,
  },
  urgencyCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5ED',
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeField: {
    flex: 1,
  },
  summaryCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: {
    gap: spacing.xxs,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
});
