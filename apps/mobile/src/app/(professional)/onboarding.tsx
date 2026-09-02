import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, ScrollView, Pressable, TextInput,
  Alert, KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
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
  { key: 'name', title: 'Nom commercial', icon: 'person-outline' as const, subtitle: 'Le nom affiché aux clients' },
  { key: 'desc', title: 'Description', icon: 'document-text-outline' as const, subtitle: 'Présentez votre expertise' },
  { key: 'exp', title: 'Expérience', icon: 'trophy-outline' as const, subtitle: "Vos années d'expérience" },
  { key: 'svc', title: 'Services', icon: 'briefcase-outline' as const, subtitle: 'Ce que vous proposez' },
  { key: 'sum', title: 'Résumé', icon: 'checkmark-circle-outline' as const, subtitle: 'Vérifiez avant de soumettre' },
];

export default function OnboardingScreen() {
  const { data: user, isLoading: userLoading, isError: userError, refetch: refetchUser } = useMe();
  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useMyProfessionalProfile();
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories } = useCategories();
  const createProfile = useCreateProfessionalProfile();
  const updateProfile = useUpdateProfessionalProfile();
  const insets = useSafeAreaInsets();

  const businessNameRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const experienceRef = useRef<TextInput>(null);

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

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const stepIconScale = useRef(new Animated.Value(1)).current;
  const summaryOpacity = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: (step + 1) / STEPS.length,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(stepIconScale, { toValue: 1.15, duration: 200, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        Animated.timing(stepIconScale, { toValue: 1, duration: 150, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    if (step === STEPS.length - 1) {
      Animated.timing(summaryOpacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else {
      summaryOpacity.setValue(0);
    }
  }, [step]);

  const animateTransition = useCallback((direction: 'next' | 'back') => {
    const toValue = direction === 'next' ? -40 : 40;
    slideAnim.setValue(toValue);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [slideAnim, fadeAnim]);

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
      animateTransition('next');
      setTimeout(() => setStep(step + 1), 50);
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
      router.replace('/(professional)/(tabs)/dashboard');
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer votre profil professionnel. Veuillez réessayer.");
    }
  }, [isLastStep, step, businessName, description, experienceYears, selectedServices, profile, updateProfile, createProfile, animateTransition]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      animateTransition('back');
      setTimeout(() => setStep(step - 1), 50);
    } else {
      router.back();
    }
  }, [step, animateTransition]);

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
          <Skeleton width="20%" height={3} style={{ borderRadius: 2 }} />
        </View>
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonIconCircle}>
            <Skeleton width={56} height={56} borderRadius={28} />
          </View>
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
          <Pressable onPress={() => router.back()} accessibilityLabel="Fermer" accessibilityRole="button" style={styles.backBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <View />
        </View>
        <ErrorState message="Impossible de charger les informations nécessaires." onRetry={() => { refetchUser(); refetchProfile(); }} />
      </SafeAreaView>
    );
  }

  const currentStep = STEPS[step];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          accessibilityLabel={step > 0 ? "Retour à l'étape précédente" : 'Fermer'}
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Ionicons name={step > 0 ? 'arrow-back' : 'close'} size={24} color={colors.text} />
        </Pressable>
        <View style={styles.stepDots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotCompleted]}
            />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.progressBar} accessibilityLabel={`Progression : étape ${step + 1} sur ${STEPS.length}`} accessibilityRole="progressbar">
        <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.stepWrapper, { transform: [{ translateX: slideAnim }], opacity: fadeAnim }]}>
            <Animated.View style={[styles.iconContainer, { transform: [{ scale: stepIconScale }] }]}>
              <View style={styles.iconCircle}>
                <Ionicons name={currentStep.icon} size={28} color={colors.primary} />
              </View>
            </Animated.View>

            <View style={styles.stepHeader}>
              <Text variant="h2" style={styles.stepTitle}>{currentStep.title}</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>{currentStep.subtitle}</Text>
            </View>

            {step === 0 && (
              <View style={styles.stepContent}>
                <View style={styles.inputGroup}>
                  <Text variant="caption" color={colors.textSecondary} style={styles.inputLabel}>VOTRE NOM</Text>
                  <TextInput
                    ref={businessNameRef}
                    style={styles.input}
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Ex: Kouamé Plomberie"
                    placeholderTextColor={colors.textTertiary}
                    maxLength={100}
                    autoFocus
                    returnKeyType="next"
                    onSubmitEditing={() => { setStep(1); setTimeout(() => descriptionRef.current?.focus(), 100); }}
                    accessibilityLabel="Nom commercial"
                  />
                  {businessName.length > 0 && (
                    <View style={styles.inputStatus}>
                      <Ionicons name={businessName.trim().length >= 2 ? 'checkmark-circle' : 'alert-circle'} size={16} color={businessName.trim().length >= 2 ? colors.success : colors.warning} />
                    </View>
                  )}
                </View>
              </View>
            )}

            {step === 1 && (
              <View style={styles.stepContent}>
                <View style={styles.inputGroup}>
                  <Text variant="caption" color={colors.textSecondary} style={styles.inputLabel}>DESCRIPTION</Text>
                  <TextInput
                    ref={descriptionRef}
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Décrivez votre expérience, vos spécialités..."
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    maxLength={500}
                    autoFocus
                    returnKeyType="next"
                    onSubmitEditing={() => { setStep(2); setTimeout(() => experienceRef.current?.focus(), 100); }}
                    accessibilityLabel="Description de votre activité"
                  />
                  <View style={styles.charCount}>
                    <Text variant="caption" color={description.length > 450 ? colors.warning : colors.textTertiary}>
                      {description.length}/500
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <View style={styles.inputGroup}>
                  <Text variant="caption" color={colors.textSecondary} style={styles.inputLabel}>ANNÉES D'EXPÉRIENCE</Text>
                  <TextInput
                    ref={experienceRef}
                    style={[styles.input, styles.inputCenter]}
                    value={experienceYears}
                    onChangeText={setExperienceYears}
                    placeholder="5"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    maxLength={2}
                    autoFocus
                    returnKeyType="done"
                    accessibilityLabel="Nombre d'années d'expérience"
                  />
                  <View style={styles.expHints}>
                    {['0', '3', '5', '10'].map((v) => (
                      <Pressable
                        key={v}
                        style={[styles.expChip, experienceYears === v && styles.expChipActive]}
                        onPress={() => setExperienceYears(v)}
                      >
                        <Text variant="caption" color={experienceYears === v ? colors.textInverse : colors.textSecondary}>{v} ans</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContent}>
                {categoriesLoading && (
                  <View style={styles.categorySkeleton}>
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} width={90} height={36} style={styles.chipSkeleton} />)}
                  </View>
                )}

                {categoriesError && (
                  <View style={styles.inlineError}>
                    <Text variant="bodySmall" color={colors.error}>Impossible de charger les catégories.</Text>
                    <Pressable onPress={() => refetchCategories()} accessibilityLabel="Réessayer" accessibilityRole="button">
                      <Text variant="bodySmall" color={colors.primary}>Réessayer</Text>
                    </Pressable>
                  </View>
                )}

                {!categoriesLoading && !categoriesError && categories && categories.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryScrollContent}>
                    {categories.map((cat) => (
                      <Pressable
                        key={cat.id}
                        style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipActive]}
                        onPress={() => setSelectedCategoryId(cat.id)}
                        accessibilityLabel={`Catégorie ${cat.name}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: selectedCategoryId === cat.id }}
                      >
                        <Text variant="bodySmall" color={selectedCategoryId === cat.id ? colors.textInverse : colors.text}>{cat.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}

                {!categoriesLoading && !categoriesError && categories && categories.length === 0 && (
                  <EmptyState icon="folder-open-outline" title="Aucune catégorie disponible" description="Les catégories ne sont pas encore configurées." />
                )}

                {selectedCategoryId && servicesLoading && (
                  <View style={styles.servicesSkeleton}>
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} width="100%" height={44} style={styles.serviceSkeletonItem} />)}
                  </View>
                )}

                {selectedCategoryId && servicesError && (
                  <View style={styles.inlineError}>
                    <Text variant="bodySmall" color={colors.error}>Impossible de charger les services.</Text>
                    <Pressable onPress={() => refetchServices()} accessibilityLabel="Réessayer" accessibilityRole="button">
                      <Text variant="bodySmall" color={colors.primary}>Réessayer</Text>
                    </Pressable>
                  </View>
                )}

                {selectedCategoryId && !servicesLoading && !servicesError && services && services.length === 0 && (
                  <View style={styles.emptyServices}>
                    <Text variant="bodySmall" color={colors.textTertiary}>Aucun service dans cette catégorie.</Text>
                  </View>
                )}

                {selectedCategoryId && !servicesLoading && !servicesError && services && services.length > 0 && (
                  <View style={styles.servicesList}>
                    {services.map((svc) => {
                      const isSelected = selectedServices.includes(svc.id);
                      return (
                        <Pressable
                          key={svc.id}
                          style={[styles.serviceItem, isSelected && styles.serviceItemActive]}
                          onPress={() => toggleService(svc.id)}
                          accessibilityLabel={`${svc.name}`}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isSelected }}
                        >
                          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                            {isSelected && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
                          </View>
                          <Text variant="body" style={styles.serviceLabel}>{svc.name}</Text>
                        </Pressable>
                      );
                    })}
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
              <Animated.View style={[styles.stepContent, { opacity: summaryOpacity }]}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <View style={styles.summaryAvatar}>
                      <Ionicons name="person" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.summaryIdentity}>
                      <Text variant="bodyMedium">{user?.fullName || ''}</Text>
                      <Text variant="caption" color={colors.textSecondary}>{businessName}</Text>
                    </View>
                  </View>

                  <View style={styles.summaryDivider} />

                  <SummaryRow icon="trophy-outline" label="Expérience" value={`${experienceYears} ans`} />
                  <SummaryRow icon="briefcase-outline" label="Services" value={`${selectedServices.length} sélectionné(s)`} />
                  <SummaryRow icon="document-text-outline" label="Description" value={description.slice(0, 60) + (description.length > 60 ? '...' : '')} />
                </View>

                {profile && (
                  <Text variant="caption" color={colors.textTertiary} align="center" style={styles.updateNote}>
                    Votre profil existant sera mis à jour.
                  </Text>
                )}
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Button
          title={isMutating ? 'Envoi...' : isLastStep ? (profile ? 'Mettre à jour' : 'Créer mon profil') : 'Continuer'}
          onPress={handleNext}
          disabled={!canProceed || isMutating}
          loading={isMutating}
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.summaryRow} accessibilityLabel={`${label} : ${value}`}>
      <View style={styles.summaryRowLeft}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      </View>
      <Text variant="bodySmall">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepDots: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderLight },
  dotActive: { width: 24, backgroundColor: colors.primary },
  dotCompleted: { backgroundColor: colors.primaryLight },
  progressBar: { height: 3, backgroundColor: colors.borderLight, marginHorizontal: spacing.lg, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxxl },
  stepWrapper: { gap: spacing.lg },
  iconContainer: { alignItems: 'center', marginBottom: spacing.sm },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.secondaryMuted, alignItems: 'center', justifyContent: 'center' },
  stepHeader: { alignItems: 'center', gap: spacing.xs },
  stepTitle: { textAlign: 'center' },
  stepContent: { gap: spacing.md },
  inputGroup: { gap: spacing.xs },
  inputLabel: { letterSpacing: 0.8, marginLeft: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 16, color: colors.text, minHeight: 52, borderWidth: 1.5, borderColor: colors.border, ...shadows.sm },
  inputCenter: { textAlign: 'center', fontSize: 32, fontWeight: '600', minHeight: 64 },
  inputStatus: { position: 'absolute', right: spacing.md, top: 42 },
  textArea: { minHeight: 130, textAlignVertical: 'top' },
  charCount: { alignItems: 'flex-end' },
  expHints: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.sm },
  expChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  expChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryScroll: { flexGrow: 0, marginVertical: spacing.xs },
  categoryScrollContent: { gap: spacing.sm },
  categoryChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, minHeight: 40, justifyContent: 'center' },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  servicesList: { gap: spacing.xs },
  serviceItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md, minHeight: 52, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  serviceItemActive: { backgroundColor: colors.successLightest, borderColor: colors.success },
  checkbox: { width: 22, height: 22, borderRadius: radius.xs, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.success, borderColor: colors.success },
  serviceLabel: { flex: 1 },
  selectionCount: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: spacing.sm },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.lg, ...shadows.md },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.secondaryMuted, alignItems: 'center', justifyContent: 'center' },
  summaryIdentity: { flex: 1, gap: 2 },
  summaryDivider: { height: 1, backgroundColor: colors.borderLight },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryRowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  updateNote: { marginTop: spacing.sm },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  skeletonContent: { padding: spacing.lg, gap: spacing.lg, alignItems: 'center' },
  skeletonIconCircle: { marginBottom: spacing.sm },
  skeletonInput: { borderRadius: radius.md },
  skeletonBtn: { borderRadius: radius.md },
  categorySkeleton: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  chipSkeleton: { borderRadius: radius.full },
  servicesSkeleton: { gap: spacing.sm, marginTop: spacing.sm },
  serviceSkeletonItem: { borderRadius: radius.md },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  emptyServices: { paddingVertical: spacing.lg, alignItems: 'center' },
});
