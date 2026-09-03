import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { UrgencyLevel } from '@/api/requests';
import { uploadsApi } from '@/api/uploads';
import { useCreateServiceRequest } from '@/hooks/use-service-requests';
import { useService } from '@/hooks/use-services';
import { useServices } from '@/hooks/use-services';
import { useCategories } from '@/hooks/use-categories';
import { useCountries, useRegions, useCities, useDistricts } from '@/hooks/use-geography';
import { useLocation } from '@/hooks/use-location';
import { extractApiError } from '@/api/errors';
import { useAuthStore } from '@/stores/auth.store';
import { usePriceEstimate } from '@/hooks/use-price-estimate';

type WizardStep = 'details' | 'category' | 'informations' | 'confirmation';

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'details', label: 'Détails' },
  { key: 'category', label: 'Catégorie' },
  { key: 'informations', label: 'Informations' },
  { key: 'confirmation', label: 'Confirmation' },
];

const BUDGET_RANGES = [
  { label: 'Moins de 10 000 FCFA', value: '0-10000' },
  { label: '10 000 - 25 000 FCFA', value: '10000-25000' },
  { label: '25 000 - 50 000 FCFA', value: '25000-50000' },
  { label: '50 000 - 100 000 FCFA', value: '50000-100000' },
  { label: 'Plus de 100 000 FCFA', value: '100000+' },
];

const PHOTO_TAGS = [
  { label: "Fuite d'eau", icon: 'water-outline' as const },
  { label: 'Installation', icon: 'construct-outline' as const },
  { label: 'Chauffe-eau', icon: 'thermometer-outline' as const },
  { label: 'Canalisation', icon: 'git-network-outline' as const },
  { label: 'Autres', icon: 'ellipsis-horizontal' as const },
];

export default function CreateRequestScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();
  const { data: preselectedService } = useService(serviceId);
  const { location: _location } = useLocation();
  const createRequest = useCreateServiceRequest();
  const insets = useSafeAreaInsets();
  const userRole = useAuthStore((s) => s.role);

  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [dateMode, setDateMode] = useState<'asap' | 'choose'>('asap');
  const [preferredDate, setPreferredDate] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false);
  const [urgency, _setUrgency] = useState<UrgencyLevel>('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(serviceId);

  // Step 3 state
  const [selectedCountryId, setSelectedCountryId] = useState<string | undefined>(undefined);
  const [selectedRegionId, setSelectedRegionId] = useState<string | undefined>(undefined);
  const [selectedCityId, setSelectedCityId] = useState<string | undefined>(undefined);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | undefined>(undefined);
  const [preferredTimeStart, setPreferredTimeStart] = useState('');
  const [preferredTimeEnd, setPreferredTimeEnd] = useState('');

  // AI price estimate
  const { data: priceEstimate } = usePriceEstimate(
    selectedServiceId || serviceId || null,
    description,
    _location?.latitude,
    _location?.longitude,
  );

  // Step 2 hooks
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories } = useCategories();
  const { data: services, isLoading: servicesLoading } = useServices(
    selectedCategoryId ? { categoryId: selectedCategoryId } : undefined,
  );

  // Step 3 hooks
  const { data: countries, isLoading: countriesLoading } = useCountries();
  const { data: regions, isLoading: regionsLoading } = useRegions(selectedCountryId);
  const { data: cities, isLoading: citiesLoading } = useCities(selectedRegionId);
  const { data: districts, isLoading: districtsLoading } = useDistricts(selectedCityId);

  // Resolve display names for confirmation
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);
  const selectedService = services?.find((s) => s.id === selectedServiceId) || preselectedService;
  const selectedCountry = countries?.find((c) => c.id === selectedCountryId);
  const selectedRegion = regions?.find((r) => r.id === selectedRegionId);
  const selectedCity = cities?.find((c) => c.id === selectedCityId);
  const selectedDistrict = districts?.find((d) => d.id === selectedDistrictId);

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

  const canProceed = () => {
    if (currentStep === 0) {
      return title.trim().length >= 5 && description.trim().length >= 10;
    }
    if (currentStep === 1) {
      return !!selectedServiceId;
    }
    if (currentStep === 2) {
      return true;
    }
    if (currentStep === 3) {
      return !!selectedServiceId && title.trim().length >= 5 && description.trim().length >= 10;
    }
    return true;
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    const finalServiceId = selectedServiceId || serviceId;
    if (!finalServiceId || !title.trim() || !description.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        const { data: uploadResponse } = await uploadsApi.uploadImages(photos, 'service-requests');
        photoUrls = uploadResponse.data.urls;
      }

      const urgencyFromDate: UrgencyLevel = dateMode === 'asap' ? 'HIGH' : urgency;

      // Build description with location context and photos
      let fullDescription = description.trim();
      const locationParts: string[] = [];
      if (selectedCity) locationParts.push(selectedCity.name);
      if (selectedDistrict) locationParts.push(selectedDistrict.name);
      if (locationParts.length > 0) {
        fullDescription += `\n\n[Localisation: ${locationParts.join(', ')}]`;
      }
      if (photoUrls.length > 0) {
        fullDescription += `\n\n[Photos: ${photoUrls.join(', ')}]`;
      }

      await createRequest.mutateAsync({
        serviceId: finalServiceId,
        title: title.trim(),
        description: fullDescription,
        urgency: urgencyFromDate,
        preferredDate: dateMode === 'choose' && preferredDate ? preferredDate : undefined,
        preferredTimeStart: preferredTimeStart || undefined,
        preferredTimeEnd: preferredTimeEnd || undefined,
      });

      router.replace('/(client)/(tabs)/home');
    } catch (err) {
      const apiError = extractApiError(err);
      setError(apiError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedServiceId(undefined);
  };

  const handleServiceSelect = (svcId: string) => {
    setSelectedServiceId(svcId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} accessibilityLabel="Retour" accessibilityRole="button" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="h3" style={styles.headerTitle}>Publier une demande</Text>
        {userRole === 'PROFESSIONAL' && (
          <Pressable
            style={styles.proChip}
            onPress={() => router.push('/(professional)/(tabs)/dashboard')}
            accessibilityLabel="Passer en mode professionnel"
            accessibilityRole="button"
          >
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text variant="caption" color={colors.primary} style={styles.proChipText}>En tant que pro</Text>
          </Pressable>
        )}
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((step, i) => (
          <View key={step.key} style={styles.stepItem}>
            <View style={styles.stepRow}>
              <View style={[styles.stepCircle, i <= currentStep && styles.stepCircleActive]}>
                <Text
                  variant="caption"
                  color={i <= currentStep ? colors.textInverse : colors.textTertiary}
                  style={styles.stepNumber}
                >
                  {i + 1}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i < currentStep && styles.stepLineActive]} />
              )}
            </View>
            <Text
              variant="caption"
              color={i <= currentStep ? colors.primary : colors.textTertiary}
              style={styles.stepLabel}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {currentStep === 0 && (
          <>
            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <View style={styles.infoBannerIcon}>
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoBannerText}>
                <Text variant="bodyMedium">Décrivez votre besoin</Text>
                <Text variant="bodySmall" color={colors.textSecondary}>
                  Plus votre demande est précise, plus vous recevez des offres adaptées.
                </Text>
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.section}>
              <Text variant="bodyMedium" style={styles.sectionLabel}>Titre de votre demande</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Réparation de fuite à Cocody"
                placeholderTextColor={colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                maxLength={80}
                accessibilityLabel="Titre de votre demande"
              />
              <Text variant="caption" color={colors.textTertiary} style={styles.charCount}>
                {title.length}/80
              </Text>
            </View>

            {/* Description Section */}
            <View style={styles.section}>
              <Text variant="bodyMedium" style={styles.sectionLabel}>Description détaillée</Text>
              <TextInput
                style={styles.textarea}
                placeholder="Décrivez votre besoin en détail (problème, contexte, etc.)"
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={500}
                textAlignVertical="top"
                accessibilityLabel="Description détaillée"
              />
              <Text variant="caption" color={colors.textTertiary} style={styles.charCount}>
                {description.length}/500
              </Text>
            </View>

            {/* AI Price Estimate */}
            {priceEstimate && priceEstimate.median > 0 && (
              <View style={styles.section}>
                <View style={styles.estimateBanner}>
                  <View style={styles.estimateHeader}>
                    <Ionicons name="sparkles" size={18} color={colors.primary} />
                    <Text variant="bodyMedium" color={colors.primary}>Estimation IA du prix</Text>
                  </View>
                  <Text variant="h3" color={colors.text} style={styles.estimateMedian}>
                    {priceEstimate.min.toLocaleString('fr-FR')} - {priceEstimate.max.toLocaleString('fr-FR')} FCFA
                  </Text>
                  <Text variant="caption" color={colors.textTertiary}>
                    Fourchette estimée • Confiance {Math.round(priceEstimate.confidence * 100)}%
                  </Text>
                </View>
              </View>
            )}

            {/* Photos Section */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text variant="bodyMedium">Photos</Text>
                <Text variant="bodySmall" color={colors.textTertiary}> (optionnel)</Text>
              </View>
              <Text variant="bodySmall" color={colors.textSecondary} style={styles.sectionSubtitle}>
                Ajoutez des photos pour aider les professionnels à mieux comprendre.
              </Text>

              {/* Photo upload area */}
              {photos.length === 0 ? (
                <Pressable
                  style={styles.photoUploadArea}
                  onPress={pickImages}
                  accessibilityLabel="Ajouter des photos"
                  accessibilityRole="button"
                >
                  <Ionicons name="images-outline" size={32} color={colors.textTertiary} />
                  <Text variant="body" color={colors.text} style={styles.photoUploadTitle}>Ajouter des photos</Text>
                  <Text variant="caption" color={colors.textTertiary}>
                    Jusqu{"'"}à 5 photos • JPG, PNG (5Mo max)
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.photoGrid}>
                  {photos.map((photo, i) => (
                    <View key={i} style={styles.photoItem}>
                      <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                      <Pressable
                        style={styles.removePhotoBtn}
                        onPress={() => removePhoto(i)}
                        accessibilityLabel="Supprimer la photo"
                        accessibilityRole="button"
                      >
                        <Ionicons name="close-circle" size={20} color={colors.error} />
                      </Pressable>
                    </View>
                  ))}
                  {photos.length < 5 && (
                    <Pressable
                      style={styles.addMorePhotoBtn}
                      onPress={pickImages}
                      accessibilityLabel="Ajouter plus de photos"
                      accessibilityRole="button"
                    >
                      <Ionicons name="add" size={24} color={colors.primary} />
                    </Pressable>
                  )}
                </View>
              )}

              {/* Photo tags */}
              <View style={styles.photoTags}>
                {PHOTO_TAGS.map((tag) => (
                  <View key={tag.label} style={styles.photoTag}>
                    <View style={styles.photoTagIcon}>
                      <Ionicons name={tag.icon} size={20} color={colors.primary} />
                    </View>
                    <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>{tag.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Date Section */}
            <View style={styles.section}>
              <Text variant="bodyMedium" style={styles.sectionLabel}>Quand avez-vous besoin du service ?</Text>
              <View style={styles.dateToggleRow}>
                <Pressable
                  style={[styles.dateToggle, dateMode === 'asap' && styles.dateToggleActive]}
                  onPress={() => setDateMode('asap')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: dateMode === 'asap' }}
                  accessibilityLabel="Dès que possible"
                >
                  <Ionicons name="calendar-outline" size={18} color={dateMode === 'asap' ? colors.secondary : colors.textSecondary} />
                  <Text variant="bodySmall" color={dateMode === 'asap' ? colors.text : colors.textSecondary}>
                    Dès que possible
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.dateToggle, dateMode === 'choose' && styles.dateToggleActive]}
                  onPress={() => setDateMode('choose')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: dateMode === 'choose' }}
                  accessibilityLabel="Choisir une date"
                >
                  <Ionicons name="calendar-outline" size={18} color={dateMode === 'choose' ? colors.secondary : colors.textSecondary} />
                  <Text variant="bodySmall" color={dateMode === 'choose' ? colors.text : colors.textSecondary}>
                    Choisir une date
                  </Text>
                </Pressable>
              </View>
              {dateMode === 'choose' && (
                <TextInput
                  style={[styles.input, { marginTop: spacing.md }]}
                  placeholder="AAAA-MM-JJ (ex: 2026-09-01)"
                  placeholderTextColor={colors.textTertiary}
                  value={preferredDate}
                  onChangeText={setPreferredDate}
                  accessibilityLabel="Date préférée"
                />
              )}
            </View>

            {/* Budget Section */}
            <View style={styles.section}>
              <View style={styles.budgetHeader}>
                <View style={styles.budgetIconWrap}>
                  <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.sectionTitleRow}>
                  <Text variant="bodyMedium">Votre budget</Text>
                  <Text variant="bodySmall" color={colors.textTertiary}> (optionnel)</Text>
                </View>
              </View>
              <Pressable
                style={styles.dropdown}
                onPress={() => setShowBudgetDropdown(!showBudgetDropdown)}
                accessibilityRole="button"
                accessibilityLabel="Sélectionner une plage de budget"
              >
                <Text
                  variant="body"
                  color={budgetRange ? colors.text : colors.textTertiary}
                >
                  {budgetRange
                    ? BUDGET_RANGES.find(b => b.value === budgetRange)?.label
                    : 'Sélectionnez une plage de budget'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
              </Pressable>
              {showBudgetDropdown && (
                <View style={styles.dropdownList}>
                  {BUDGET_RANGES.map((range) => (
                    <Pressable
                      key={range.value}
                      style={[styles.dropdownItem, budgetRange === range.value && styles.dropdownItemActive]}
                      onPress={() => { setBudgetRange(range.value); setShowBudgetDropdown(false); }}
                      accessibilityRole="menuitem"
                      accessibilityLabel={range.label}
                    >
                      <Text variant="body" color={budgetRange === range.value ? colors.primary : colors.text}>
                        {range.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {error && (
              <Text variant="bodySmall" color={colors.error} style={styles.errorText}>{error}</Text>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* STEP 2 — CATÉGORIE / SERVICE                                 */}
        {/* ============================================================ */}
        {currentStep === 1 && (
          <>
            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <View style={styles.infoBannerIcon}>
                <Ionicons name="grid-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoBannerText}>
                <Text variant="bodyMedium">Choisissez un service</Text>
                <Text variant="bodySmall" color={colors.textSecondary}>
                  Sélectionnez la catégorie puis le service correspondant à votre besoin.
                </Text>
              </View>
            </View>

            {/* Categories */}
            <View style={styles.section}>
              <Text variant="bodyMedium" style={styles.sectionLabel}>Catégorie</Text>

              {categoriesLoading && (
                <View style={styles.skeletonGrid}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} width="48%" height={56} style={styles.skeletonCard} />
                  ))}
                </View>
              )}

              {categoriesError && (
                <View style={styles.inlineError}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                  <Text variant="bodySmall" color={colors.error} style={styles.inlineErrorText}>
                    Impossible de charger les catégories
                  </Text>
                  <Pressable
                    onPress={() => refetchCategories()}
                    accessibilityRole="button"
                    accessibilityLabel="Réessayer"
                  >
                    <Text variant="bodySmall" color={colors.primary} style={styles.retryLink}>Réessayer</Text>
                  </Pressable>
                </View>
              )}

              {categories && categories.length === 0 && (
                <View style={styles.inlineEmpty}>
                  <Ionicons name="file-tray-outline" size={24} color={colors.textTertiary} />
                  <Text variant="bodySmall" color={colors.textTertiary}>Aucune catégorie disponible</Text>
                </View>
              )}

              {categories && categories.length > 0 && (
                <View style={styles.categoryGrid}>
                  {categories.filter((c) => c.isActive).map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.categoryCard,
                        selectedCategoryId === cat.id && styles.categoryCardActive,
                      ]}
                      onPress={() => handleCategorySelect(cat.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: selectedCategoryId === cat.id }}
                      accessibilityLabel={cat.name}
                    >
                      <Ionicons
                        name="folder-outline"
                        size={20}
                        color={selectedCategoryId === cat.id ? colors.secondary : colors.textSecondary}
                      />
                      <Text
                        variant="bodySmall"
                        color={selectedCategoryId === cat.id ? colors.primary : colors.text}
                        numberOfLines={2}
                        style={styles.categoryCardText}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Services for selected category */}
            {selectedCategoryId && (
              <View style={styles.section}>
                <Text variant="bodyMedium" style={styles.sectionLabel}>Service</Text>

                {servicesLoading && (
                  <View style={styles.servicesList}>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} width="100%" height={52} style={styles.skeletonServiceRow} />
                    ))}
                  </View>
                )}

                {services && services.length === 0 && (
                  <View style={styles.inlineEmpty}>
                    <Ionicons name="file-tray-outline" size={24} color={colors.textTertiary} />
                    <Text variant="bodySmall" color={colors.textTertiary}>Aucun service dans cette catégorie</Text>
                  </View>
                )}

                {services && services.length > 0 && (
                  <View style={styles.servicesList}>
                    {services.filter((s) => s.isActive).map((svc) => (
                      <Pressable
                        key={svc.id}
                        style={[
                          styles.serviceRow,
                          selectedServiceId === svc.id && styles.serviceRowActive,
                        ]}
                        onPress={() => handleServiceSelect(svc.id)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: selectedServiceId === svc.id }}
                        accessibilityLabel={svc.name}
                      >
                        <View style={styles.serviceRowLeft}>
                          <Ionicons
                            name="construct-outline"
                            size={18}
                            color={selectedServiceId === svc.id ? colors.primary : colors.textSecondary}
                          />
                          <View style={styles.serviceRowInfo}>
                            <Text
                              variant="body"
                              color={selectedServiceId === svc.id ? colors.primary : colors.text}
                              numberOfLines={1}
                            >
                              {svc.name}
                            </Text>
                            {svc.description && (
                              <Text variant="caption" color={colors.textTertiary} numberOfLines={1}>
                                {svc.description}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={[styles.serviceRadio, selectedServiceId === svc.id && styles.serviceRadioActive]}>
                          {selectedServiceId === svc.id && <View style={styles.serviceRadioInner} />}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Pre-selected service info */}
            {serviceId && preselectedService && !selectedCategoryId && (
              <View style={styles.section}>
                <View style={styles.preselectedBanner}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <View style={styles.preselectedInfo}>
                    <Text variant="bodySmall" color={colors.textSecondary}>Service pré-sélectionné</Text>
                    <Text variant="bodyMedium" color={colors.text}>{preselectedService.name}</Text>
                  </View>
                </View>
                <Pressable
                  style={styles.changeServiceBtn}
                  onPress={() => setSelectedCategoryId(preselectedService.categoryId)}
                  accessibilityRole="button"
                  accessibilityLabel="Changer de service"
                >
                  <Text variant="bodySmall" color={colors.primary}>Changer de service</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* STEP 3 — INFORMATIONS (LOCALISATION + HORAIRES)              */}
        {/* ============================================================ */}
        {currentStep === 2 && (
          <>
            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <View style={styles.infoBannerIcon}>
                <Ionicons name="location-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoBannerText}>
                <Text variant="bodyMedium">Localisation et disponibilité</Text>
                <Text variant="bodySmall" color={colors.textSecondary}>
                  Ces informations aident les professionnels à vous répondre plus vite.
                </Text>
              </View>
            </View>

            {/* Location Section */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text variant="bodyMedium">Localisation</Text>
                <Text variant="bodySmall" color={colors.textTertiary}> (optionnel)</Text>
              </View>
              <Text variant="bodySmall" color={colors.textSecondary} style={styles.sectionSubtitle}>
                Où souhaitez-vous que le service soit effectué ?
              </Text>

              {/* Country */}
              <View style={styles.geoField}>
                <Text variant="bodySmall" style={styles.geoLabel}>Pays</Text>
                {countriesLoading ? (
                  <Skeleton width="100%" height={48} />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.geoChipScroll}>
                    {countries?.map((country) => (
                      <Pressable
                        key={country.id}
                        style={[styles.geoChip, selectedCountryId === country.id && styles.geoChipActive]}
                        onPress={() => {
                          setSelectedCountryId(country.id);
                          setSelectedRegionId(undefined);
                          setSelectedCityId(undefined);
                          setSelectedDistrictId(undefined);
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: selectedCountryId === country.id }}
                        accessibilityLabel={country.name}
                      >
                        <Text
                          variant="bodySmall"
                          color={selectedCountryId === country.id ? colors.primary : colors.textSecondary}
                        >
                          {country.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Region */}
              {selectedCountryId && (
                <View style={styles.geoField}>
                  <Text variant="bodySmall" style={styles.geoLabel}>Région</Text>
                  {regionsLoading ? (
                    <Skeleton width="100%" height={48} />
                  ) : regions && regions.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.geoChipScroll}>
                      {regions.map((region) => (
                        <Pressable
                          key={region.id}
                          style={[styles.geoChip, selectedRegionId === region.id && styles.geoChipActive]}
                          onPress={() => {
                            setSelectedRegionId(region.id);
                            setSelectedCityId(undefined);
                            setSelectedDistrictId(undefined);
                          }}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: selectedRegionId === region.id }}
                          accessibilityLabel={region.name}
                        >
                          <Text
                            variant="bodySmall"
                            color={selectedRegionId === region.id ? colors.primary : colors.textSecondary}
                          >
                            {region.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text variant="caption" color={colors.textTertiary}>Aucune région disponible</Text>
                  )}
                </View>
              )}

              {/* City */}
              {selectedRegionId && (
                <View style={styles.geoField}>
                  <Text variant="bodySmall" style={styles.geoLabel}>Ville</Text>
                  {citiesLoading ? (
                    <Skeleton width="100%" height={48} />
                  ) : cities && cities.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.geoChipScroll}>
                      {cities.map((city) => (
                        <Pressable
                          key={city.id}
                          style={[styles.geoChip, selectedCityId === city.id && styles.geoChipActive]}
                          onPress={() => {
                            setSelectedCityId(city.id);
                            setSelectedDistrictId(undefined);
                          }}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: selectedCityId === city.id }}
                          accessibilityLabel={city.name}
                        >
                          <Text
                            variant="bodySmall"
                            color={selectedCityId === city.id ? colors.primary : colors.textSecondary}
                          >
                            {city.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text variant="caption" color={colors.textTertiary}>Aucune ville disponible</Text>
                  )}
                </View>
              )}

              {/* District / Commune */}
              {selectedCityId && (
                <View style={styles.geoField}>
                  <Text variant="bodySmall" style={styles.geoLabel}>Commune</Text>
                  {districtsLoading ? (
                    <Skeleton width="100%" height={48} />
                  ) : districts && districts.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.geoChipScroll}>
                      {districts.map((district) => (
                        <Pressable
                          key={district.id}
                          style={[styles.geoChip, selectedDistrictId === district.id && styles.geoChipActive]}
                          onPress={() => setSelectedDistrictId(district.id)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: selectedDistrictId === district.id }}
                          accessibilityLabel={district.name}
                        >
                          <Text
                            variant="bodySmall"
                            color={selectedDistrictId === district.id ? colors.primary : colors.textSecondary}
                          >
                            {district.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text variant="caption" color={colors.textTertiary}>Aucune commune disponible</Text>
                  )}
                </View>
              )}
            </View>

            {/* Time Preferences */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text variant="bodyMedium">Créneaux horaires préférés</Text>
                <Text variant="bodySmall" color={colors.textTertiary}> (optionnel)</Text>
              </View>
              <Text variant="bodySmall" color={colors.textSecondary} style={styles.sectionSubtitle}>
                Indiquez vos disponibilités pour faciliter la prise de rendez-vous.
              </Text>

              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text variant="caption" color={colors.textSecondary} style={styles.timeLabel}>De</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="08:00"
                    placeholderTextColor={colors.textTertiary}
                    value={preferredTimeStart}
                    onChangeText={setPreferredTimeStart}
                    accessibilityLabel="Heure de début"
                  />
                </View>
                <View style={styles.timeField}>
                  <Text variant="caption" color={colors.textSecondary} style={styles.timeLabel}>À</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="18:00"
                    placeholderTextColor={colors.textTertiary}
                    value={preferredTimeEnd}
                    onChangeText={setPreferredTimeEnd}
                    accessibilityLabel="Heure de fin"
                  />
                </View>
              </View>
            </View>
          </>
        )}

        {/* ============================================================ */}
        {/* STEP 4 — RÉCAPITULATIF / CONFIRMATION                        */}
        {/* ============================================================ */}
        {currentStep === 3 && (
          <>
            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <View style={styles.infoBannerIcon}>
                <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
              </View>
              <View style={styles.infoBannerText}>
                <Text variant="bodyMedium">Vérifiez votre demande</Text>
                <Text variant="bodySmall" color={colors.textSecondary}>
                  Relisez les informations avant de publier votre demande.
                </Text>
              </View>
            </View>

            {/* Service Section */}
            <View style={styles.section}>
              <View style={styles.summaryHeader}>
                <Ionicons name="construct-outline" size={18} color={colors.primary} />
                <Text variant="bodyMedium" style={styles.summaryTitle}>Service</Text>
                <Pressable
                  onPress={() => goToStep(1)}
                  accessibilityRole="button"
                  accessibilityLabel="Modifier le service"
                  style={styles.editBtn}
                >
                  <Text variant="caption" color={colors.primary}>Modifier</Text>
                </Pressable>
              </View>
              {selectedCategory && (
                <Text variant="bodySmall" color={colors.textSecondary}>
                  {selectedCategory.name}
                </Text>
              )}
              <Text variant="body" color={colors.text}>
                {selectedService?.name || 'Non sélectionné'}
              </Text>
            </View>

            {/* Details Section */}
            <View style={styles.section}>
              <View style={styles.summaryHeader}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                <Text variant="bodyMedium" style={styles.summaryTitle}>Détails</Text>
                <Pressable
                  onPress={() => goToStep(0)}
                  accessibilityRole="button"
                  accessibilityLabel="Modifier les détails"
                  style={styles.editBtn}
                >
                  <Text variant="caption" color={colors.primary}>Modifier</Text>
                </Pressable>
              </View>
              <Text variant="bodyMedium" color={colors.text}>{title || '—'}</Text>
              <Text variant="bodySmall" color={colors.textSecondary} numberOfLines={4} style={styles.summaryDesc}>
                {description || '—'}
              </Text>
              {photos.length > 0 && (
                <View style={styles.summaryPhotos}>
                  {photos.map((photo, i) => (
                    <Image key={i} source={{ uri: photo.uri }} style={styles.summaryPhotoThumb} />
                  ))}
                </View>
              )}
            </View>

            {/* Date & Urgency */}
            <View style={styles.section}>
              <View style={styles.summaryHeader}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text variant="bodyMedium" style={styles.summaryTitle}>Date et urgence</Text>
                <Pressable
                  onPress={() => goToStep(0)}
                  accessibilityRole="button"
                  accessibilityLabel="Modifier la date"
                  style={styles.editBtn}
                >
                  <Text variant="caption" color={colors.primary}>Modifier</Text>
                </Pressable>
              </View>
              <Text variant="body" color={colors.text}>
                {dateMode === 'asap' ? 'Dès que possible' : preferredDate || 'Date non précisée'}
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Urgence : {dateMode === 'asap' ? 'Élevée' : 'Normale'}
              </Text>
            </View>

            {/* Location */}
            {(selectedCity || selectedDistrict) && (
              <View style={styles.section}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                  <Text variant="bodyMedium" style={styles.summaryTitle}>Localisation</Text>
                  <Pressable
                    onPress={() => goToStep(2)}
                    accessibilityRole="button"
                    accessibilityLabel="Modifier la localisation"
                    style={styles.editBtn}
                  >
                    <Text variant="caption" color={colors.primary}>Modifier</Text>
                  </Pressable>
                </View>
                <Text variant="body" color={colors.text}>
                  {[selectedDistrict?.name, selectedCity?.name, selectedRegion?.name, selectedCountry?.name]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            )}

            {/* Time Preferences */}
            {(preferredTimeStart || preferredTimeEnd) && (
              <View style={styles.section}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text variant="bodyMedium" style={styles.summaryTitle}>Créneaux</Text>
                  <Pressable
                    onPress={() => goToStep(2)}
                    accessibilityRole="button"
                    accessibilityLabel="Modifier les créneaux"
                    style={styles.editBtn}
                  >
                    <Text variant="caption" color={colors.primary}>Modifier</Text>
                  </Pressable>
                </View>
                <Text variant="body" color={colors.text}>
                  {preferredTimeStart || '—'} → {preferredTimeEnd || '—'}
                </Text>
              </View>
            )}

            {/* Budget (local only) */}
            {budgetRange && (
              <View style={styles.section}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="wallet-outline" size={18} color={colors.primary} />
                  <Text variant="bodyMedium" style={styles.summaryTitle}>Budget indicatif</Text>
                  <Pressable
                    onPress={() => goToStep(0)}
                    accessibilityRole="button"
                    accessibilityLabel="Modifier le budget"
                    style={styles.editBtn}
                  >
                    <Text variant="caption" color={colors.primary}>Modifier</Text>
                  </Pressable>
                </View>
                <Text variant="body" color={colors.text}>
                  {BUDGET_RANGES.find(b => b.value === budgetRange)?.label}
                </Text>
                <Text variant="caption" color={colors.warning} style={styles.budgetWarning}>
                  Information indicative — non transmise au serveur
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.submitError}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text variant="bodySmall" color={colors.error} style={styles.submitErrorText}>{error}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* CTA Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Pressable
          style={[styles.ctaButton, !canProceed() && styles.ctaButtonDisabled]}
          onPress={currentStep === STEPS.length - 1 ? handleSubmit : goNext}
          disabled={!canProceed() || isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={currentStep === STEPS.length - 1 ? 'Confirmer et publier' : 'Continuer'}
          accessibilityState={{ disabled: !canProceed() || isSubmitting }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <>
              <Text variant="button" color={colors.textInverse}>
                {currentStep === STEPS.length - 1 ? 'Confirmer et publier' : 'Continuer'}
              </Text>
              <Ionicons
                name={currentStep === STEPS.length - 1 ? 'checkmark' : 'arrow-forward'}
                size={20}
                color={colors.textInverse}
              />
            </>
          )}
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  proChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  proChipText: {},
  stepper: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {},
  stepLine: {
    position: 'absolute',
    left: '64%',
    right: '-36%',
    height: 2,
    backgroundColor: colors.border,
    top: 13,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    marginTop: spacing.xs,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  infoBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  estimateBanner: {
    backgroundColor: colors.secondaryMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.secondary + '30',
  },
  estimateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  estimateMedian: {
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sectionSubtitle: {
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 120,
  },
  charCount: {
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  photoUploadArea: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
  },
  photoUploadTitle: {
    marginTop: spacing.xs,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  photoItem: {
    position: 'relative',
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  addMorePhotoBtn: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTags: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  photoTag: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  photoTagIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateToggleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  dateToggleActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.warningLightest,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  budgetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  dropdownList: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dropdownItemActive: {
    backgroundColor: colors.surfaceSecondary,
  },
  errorText: {
    marginBottom: spacing.md,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  // Step 2 styles
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  skeletonCard: {
    borderRadius: radius.md,
  },
  skeletonServiceRow: {
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  inlineErrorText: {
    flex: 1,
  },
  retryLink: {},
  inlineEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  categoryCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSecondary,
  },
  categoryCardText: {
    flex: 1,
  },
  servicesList: {
    gap: spacing.sm,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  serviceRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSecondary,
  },
  serviceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  serviceRowInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  serviceRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceRadioActive: {
    borderColor: colors.primary,
  },
  serviceRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  preselectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  preselectedInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  changeServiceBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  // Step 3 styles
  geoField: {
    marginBottom: spacing.lg,
  },
  geoLabel: {
    marginBottom: spacing.sm,
  },
  geoChipScroll: {
    flexGrow: 0,
  },
  geoChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    marginRight: spacing.sm,
    backgroundColor: colors.background,
  },
  geoChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    marginBottom: spacing.sm,
  },
  // Step 4 styles
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    flex: 1,
  },
  editBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  summaryDesc: {
    marginTop: spacing.xs,
  },
  summaryPhotos: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  summaryPhotoThumb: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  budgetWarning: {
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  submitError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorLight,
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  submitErrorText: {
    flex: 1,
  },
});
