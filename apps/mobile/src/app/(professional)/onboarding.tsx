import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Button, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useCategories } from '@/hooks/use-categories';
import { useServices } from '@/hooks/use-services';
import { useCreateProfessionalProfile, useMyProfessionalProfile, useUpdateProfessionalProfile } from '@/hooks/use-professional-profile';
import { useMe } from '@/hooks/use-me';

const STEPS = [
  'Nom commercial',
  'Description',
  'Expérience',
  'Services',
  'Résumé',
];

export default function OnboardingScreen() {
  const { data: user, isLoading: userLoading, isError: userError, refetch: refetchUser } = useMe();
  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useMyProfessionalProfile();
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories } = useCategories();
  const createProfile = useCreateProfessionalProfile();
  const updateProfile = useUpdateProfessionalProfile();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [initialized, setInitialized] = useState(false);

  const { data: services, isLoading: servicesLoading, isError: servicesError, refetch: refetchServices } = useServices(
    selectedCategoryId ? { categoryId: selectedCategoryId } : undefined,
  );

  useEffect(() => {
    if (!initialized && profile && !profileLoading) {
      setBusinessName(profile.businessName || '');
      setDescription(profile.description || '');
      setExperienceYears(String(profile.experienceYears || ''));
      setSelectedServices(profile.services?.map((s: { id: string }) => s.id) || []);
      setInitialized(true);
    }
    if (!initialized && !profile && !profileLoading) {
      setInitialized(true);
    }
  }, [profile, profileLoading, initialized]);

  const isInitialLoading = userLoading || profileLoading;
  const isInitialError = userError || profileError;

  const isLastStep = step === STEPS.length - 1;
  const canProceed = (() => {
    switch (step) {
      case 0: return businessName.trim().length >= 2;
      case 1: return description.trim().length >= 10;
      case 2: return experienceYears.trim().length > 0 && Number(experienceYears) >= 0;
      case 3: return selectedServices.length > 0;
      case 4: return true;
      default: return false;
    }
  })();

  const isMutating = createProfile.isPending || updateProfile.isPending;

  const handleNext = useCallback(async () => {
    if (!isLastStep) {
      setStep(step + 1);
      return;
    }

    const payload = {
      businessName: businessName.trim(),
      description: description.trim(),
      experienceYears: Number(experienceYears),
      serviceIds: selectedServices,
    };

    try {
      if (profile) {
        await updateProfile.mutateAsync({
          id: profile.id,
          businessName: payload.businessName,
          description: payload.description,
          experienceYears: payload.experienceYears,
        });
      } else {
        await createProfile.mutateAsync(payload);
      }
      router.replace('/(professional)/(tabs)/dashboard' as never);
    } catch {
      Alert.alert(
        'Erreur',
        'Impossible d\'enregistrer votre profil professionnel. Veuillez réessayer.',
      );
    }
  }, [isLastStep, step, businessName, description, experienceYears, selectedServices, profile, updateProfile, createProfile]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  }, [step]);

  const toggleService = useCallback((id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }, []);

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.backBtn} />
          <Skeleton width={60} height={16} />
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '20%' }]} />
        </View>
        <View style={styles.skeletonContent}>
          <Skeleton width="50%" height={28} />
          <Skeleton width="80%" height={16} />
          <Skeleton width="100%" height={48} style={styles.skeletonInput} />
          <Skeleton width="100%" height={48} style={styles.skeletonInput} />
        </View>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Skeleton width="100%" height={48} style={styles.skeletonBtn} />
        </View>
      </SafeAreaView>
    );
  }

  if (isInitialError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Fermer"
            accessibilityRole="button"
            style={styles.backBtn}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <View />
        </View>
        <ErrorState
          message="Impossible de charger les informations nécessaires."
          onRetry={() => {
            refetchUser();
            refetchProfile();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          accessibilityLabel={step > 0 ? 'Retour à l\'étape précédente' : 'Fermer'}
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Ionicons name={step > 0 ? 'arrow-back' : 'close'} size={24} color={colors.text} />
        </Pressable>
        <Text
          variant="bodySmall"
          color={colors.textSecondary}
          accessibilityLabel={`Étape ${step + 1} sur ${STEPS.length}`}
        >
          {step + 1} / {STEPS.length}
        </Text>
      </View>

      <View
        style={styles.progressBar}
        accessibilityLabel={`Progression : étape ${step + 1} sur ${STEPS.length}`}
        accessibilityRole="progressbar"
      >
        <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text variant="h2">Nom commercial</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>
                Le nom qui sera affiché aux clients.
              </Text>
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Ex: Kouamé Plomberie"
                placeholderTextColor={colors.textTertiary}
                maxLength={100}
                autoFocus
                accessibilityLabel="Nom commercial"
              />
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text variant="h2">Description</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>
                Présentez votre activité et votre expertise.
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez votre expérience, vos spécialités..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={500}
                autoFocus
                accessibilityLabel="Description de votre activité"
              />
              <Text variant="caption" color={colors.textTertiary} align="right">
                {description.length}/500
              </Text>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text variant="h2">Expérience</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>
                {"Combien d'années d'expérience avez-vous ?"}
              </Text>
              <TextInput
                style={styles.input}
                value={experienceYears}
                onChangeText={setExperienceYears}
                placeholder="5"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                maxLength={2}
                autoFocus
                accessibilityLabel="Nombre d'années d'expérience"
              />
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text variant="h2">Services</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>
                Sélectionnez les services que vous proposez.
              </Text>

              {categoriesLoading && (
                <View style={styles.categorySkeleton}>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} width={90} height={32} style={styles.chipSkeleton} />
                  ))}
                </View>
              )}

              {categoriesError && (
                <View style={styles.inlineError}>
                  <Text variant="bodySmall" color={colors.error}>
                    Impossible de charger les catégories.
                  </Text>
                  <Pressable
                    onPress={() => refetchCategories()}
                    accessibilityLabel="Réessayer de charger les catégories"
                    accessibilityRole="button"
                  >
                    <Text variant="bodySmall" color={colors.primary}>Réessayer</Text>
                  </Pressable>
                </View>
              )}

              {!categoriesLoading && !categoriesError && categories && categories.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                  contentContainerStyle={styles.categoryScrollContent}
                >
                  {categories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipActive]}
                      onPress={() => setSelectedCategoryId(cat.id)}
                      accessibilityLabel={`Catégorie ${cat.name}${selectedCategoryId === cat.id ? ', sélectionnée' : ''}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedCategoryId === cat.id }}
                    >
                      <Text variant="bodySmall" color={selectedCategoryId === cat.id ? colors.textInverse : colors.text}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {!categoriesLoading && !categoriesError && categories && categories.length === 0 && (
                <EmptyState
                  icon="folder-open-outline"
                  title="Aucune catégorie disponible"
                  description="Les catégories de services ne sont pas encore configurées."
                />
              )}

              {selectedCategoryId && servicesLoading && (
                <View style={styles.servicesSkeleton}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} width="100%" height={40} style={styles.serviceSkeletonItem} />
                  ))}
                </View>
              )}

              {selectedCategoryId && servicesError && (
                <View style={styles.inlineError}>
                  <Text variant="bodySmall" color={colors.error}>
                    Impossible de charger les services.
                  </Text>
                  <Pressable
                    onPress={() => refetchServices()}
                    accessibilityLabel="Réessayer de charger les services"
                    accessibilityRole="button"
                  >
                    <Text variant="bodySmall" color={colors.primary}>Réessayer</Text>
                  </Pressable>
                </View>
              )}

              {selectedCategoryId && !servicesLoading && !servicesError && services && services.length === 0 && (
                <View style={styles.emptyServices}>
                  <Text variant="bodySmall" color={colors.textTertiary}>
                    Aucun service dans cette catégorie.
                  </Text>
                </View>
              )}

              {selectedCategoryId && !servicesLoading && !servicesError && services && services.length > 0 && (
                <View style={styles.servicesList}>
                  {services.map((svc) => (
                    <Pressable
                      key={svc.id}
                      style={[styles.serviceItem, selectedServices.includes(svc.id) && styles.serviceItemActive]}
                      onPress={() => toggleService(svc.id)}
                      accessibilityLabel={`${svc.name}${selectedServices.includes(svc.id) ? ', sélectionné' : ''}`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selectedServices.includes(svc.id) }}
                    >
                      <Ionicons
                        name={selectedServices.includes(svc.id) ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={selectedServices.includes(svc.id) ? colors.primary : colors.textTertiary}
                      />
                      <Text variant="body" style={styles.serviceLabel}>{svc.name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {selectedServices.length > 0 && (
                <View style={styles.selectionCount}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text variant="bodySmall" color={colors.success}>
                    {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} sélectionné{selectedServices.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContent}>
              <Text variant="h2">Résumé</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>
                Vérifiez vos informations avant de soumettre.
              </Text>

              <View style={styles.summaryCard}>
                <SummaryRow label="Nom" value={user?.fullName || ''} />
                <SummaryRow label="Nom commercial" value={businessName} />
                <SummaryRow label="Expérience" value={`${experienceYears} ans`} />
                <SummaryRow label="Services" value={`${selectedServices.length} sélectionné(s)`} />
                <SummaryRow label="Description" value={description.slice(0, 80) + (description.length > 80 ? '...' : '')} />
              </View>

              {profile && (
                <Text variant="caption" color={colors.textTertiary} align="center">
                  Votre profil existant sera mis à jour.
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title={isMutating
            ? 'Envoi...'
            : isLastStep
              ? (profile ? 'Mettre à jour' : 'Créer mon profil')
              : 'Suivant'}
          onPress={handleNext}
          disabled={!canProceed || isMutating}
          loading={isMutating}
        />
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow} accessibilityLabel={`${label} : ${value}`}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  progressBar: { height: 3, backgroundColor: colors.borderLight, marginHorizontal: spacing.lg },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxxl },
  stepContent: { gap: spacing.md },
  input: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 16, color: colors.text, minHeight: 48 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  categoryScroll: { flexGrow: 0, marginVertical: spacing.sm },
  categoryScrollContent: { gap: spacing.sm },
  categoryChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary, minHeight: 36, justifyContent: 'center' },
  categoryChipActive: { backgroundColor: colors.primary },
  servicesList: { gap: spacing.xs },
  serviceItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, minHeight: 48, borderRadius: radius.sm },
  serviceItemActive: { backgroundColor: colors.surfaceSecondary },
  serviceLabel: { flex: 1 },
  selectionCount: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: spacing.sm },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadows.sm },
  summaryRow: { gap: 2 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  // Skeleton styles
  skeletonContent: { padding: spacing.lg, gap: spacing.lg },
  skeletonInput: { borderRadius: radius.md },
  skeletonBtn: { borderRadius: radius.md },
  // Inline states
  categorySkeleton: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  chipSkeleton: { borderRadius: radius.full },
  servicesSkeleton: { gap: spacing.sm, marginTop: spacing.sm },
  serviceSkeletonItem: { borderRadius: radius.sm },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  emptyServices: { paddingVertical: spacing.lg, alignItems: 'center' },
});
