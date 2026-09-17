import { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LottieAnimation } from '@/components/ui/LottieAnimation';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { messages } from '@/constants/messages';
import { UrgencyLevel } from '@/api/requests';
import { uploadsApi } from '@/api/uploads';
import { aiApi, DiagnosisResult } from '@/api/ai';
import { useCreateServiceRequest } from '@/hooks/use-service-requests';
import { useService } from '@/hooks/use-services';
import { useServices } from '@/hooks/use-services';
import { useCategories } from '@/hooks/use-categories';
import { useCountries, useRegions, useCities, useDistricts } from '@/hooks/use-geography';
import { useLocation } from '@/hooks/use-location';
import { extractApiError } from '@/api/errors';
import { useAuthStore } from '@/stores/auth.store';
import { usePriceEstimate } from '@/hooks/use-price-estimate';
import { useAddresses } from '@/hooks/use-addresses';

type WizardStep = 'service' | 'details' | 'location' | 'confirmation';

const STEPS: { key: WizardStep; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'service', label: 'Service', icon: 'construct-outline' },
  { key: 'details', label: 'Détails', icon: 'document-text-outline' },
  { key: 'location', label: 'Lieu', icon: 'location-outline' },
  { key: 'confirmation', label: 'Confirmer', icon: 'checkmark-circle-outline' },
];

const STEP_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Maison & Habitat': 'home-outline',
  'Électronique & Technologie': 'phone-portrait-outline',
  'Automobile': 'car-outline',
  'Entretien': 'sparkles-outline',
  'BTP': 'hammer-outline',
  'Transport & Logistique': 'bicycle-outline',
  'Événementiel': 'ribbon-outline',
  'Beauté & Bien-être': 'color-palette-outline',
  'Éducation': 'school-outline',
  'Services professionnels': 'briefcase-outline',
  'Services aux entreprises': 'business-outline',
};

const BUDGET_RANGES = [
  { label: 'Moins de 10 000 FCFA', value: '0-10000' },
  { label: '10 000 - 25 000 FCFA', value: '10000-25000' },
  { label: '25 000 - 50 000 FCFA', value: '25000-50000' },
  { label: '50 000 - 100 000 FCFA', value: '50000-100000' },
  { label: 'Plus de 100 000 FCFA', value: '100000+' },
];

const DATE_OPTIONS = [
  { key: 'today', label: "Aujourd'hui", icon: 'sunny-outline' as const },
  { key: 'tomorrow', label: 'Demain', icon: 'moon-outline' as const },
  { key: '3days', label: 'Dans 3 jours', icon: 'calendar-outline' as const },
  { key: 'thisweek', label: 'Cette semaine', icon: 'calendar-outline' as const },
  { key: 'free', label: 'Libre', icon: 'time-outline' as const },
  { key: 'custom', label: 'Autre date', icon: 'create-outline' as const },
] as const;

type DateOptionKey = typeof DATE_OPTIONS[number]['key'];

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
  const { location: _location, address: detectedAddress, isLoading: locationLoading } = useLocation();
  const createRequest = useCreateServiceRequest();
  const insets = useSafeAreaInsets();
  const userRole = useAuthStore((s) => s.role);

  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [dateMode, setDateMode] = useState<'asap' | 'choose'>('asap');
  const [preferredDate, setPreferredDate] = useState('');
  const [dateOption, setDateOption] = useState<DateOptionKey>('today');
  const [budgetRange, setBudgetRange] = useState('');
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false);
  const [urgency] = useState<UrgencyLevel>('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(serviceId);

  const [selectedCountryId, setSelectedCountryId] = useState<string | undefined>(undefined);
  const [selectedRegionId, setSelectedRegionId] = useState<string | undefined>(undefined);
  const [selectedCityId, setSelectedCityId] = useState<string | undefined>(undefined);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | undefined>(undefined);
  const [preferredTimeStart, setPreferredTimeStart] = useState('');
  const [preferredTimeEnd, setPreferredTimeEnd] = useState('');

  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);

  const { data: savedAddresses } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);

  const runDiagnosis = useCallback(async (photoUri: string) => {
    setDiagnosisLoading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(photoUri, { encoding: FileSystem.EncodingType.Base64 });
      const { data: res } = await aiApi.diagnose(base64);
      setDiagnosis(res.data);
      if (res.data.confidence >= 0.6) {
        if (!title.trim()) setTitle(res.data.issue.slice(0, 80));
        if (!description.trim()) setDescription(res.data.issue);
      }
    } catch {
      // Silent fail — diagnosis is optional
    } finally {
      setDiagnosisLoading(false);
    }
  }, [title, description]);

  const handleTagPress = useCallback(async (tagLabel: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const newPhoto = { uri: asset.uri, name: asset.fileName || `photo_${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg' };
      setPhotos((prev) => [...prev, newPhoto].slice(0, 5));
      if (!title.trim()) setTitle(tagLabel);
      runDiagnosis(asset.uri);
    }
  }, [title, runDiagnosis]);

  const { data: priceEstimate } = usePriceEstimate(
    selectedServiceId || serviceId || null,
    description,
    _location?.latitude,
    _location?.longitude,
  );

  const { data: categories, isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories } = useCategories();
  const { data: services, isLoading: servicesLoading } = useServices(
    selectedCategoryId ? { categoryId: selectedCategoryId } : undefined,
  );

  const { data: countries, isLoading: countriesLoading } = useCountries();
  const { data: regions, isLoading: regionsLoading } = useRegions(selectedCountryId);
  const { data: cities, isLoading: citiesLoading } = useCities(selectedRegionId);
  const { data: districts, isLoading: districtsLoading } = useDistricts(selectedCityId);

  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);
  const selectedService = services?.find((s) => s.id === selectedServiceId) || preselectedService;
  const selectedCountry = countries?.find((c) => c.id === selectedCountryId);
  const selectedRegion = regions?.find((r) => r.id === selectedRegionId);
  const selectedCity = cities?.find((c) => c.id === selectedCityId);
  const selectedDistrict = districts?.find((d) => d.id === selectedDistrictId);

  const computedDate = useMemo(() => {
    if (dateOption === 'custom' || dateOption === 'free') return preferredDate || undefined;
    const now = new Date();
    let d: Date;
    switch (dateOption) {
      case 'today':
        d = now;
        break;
      case 'tomorrow':
        d = new Date(now);
        d.setDate(d.getDate() + 1);
        break;
      case '3days':
        d = new Date(now);
        d.setDate(d.getDate() + 3);
        break;
      case 'thisweek': {
        d = new Date(now);
        const day = d.getDay();
        const daysToSunday = day === 0 ? 0 : 7 - day;
        d.setDate(d.getDate() + daysToSunday);
        break;
      }
      default:
        return undefined;
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  }, [dateOption, preferredDate]);

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
      if (result.assets.length > 0 && !diagnosis) {
        runDiagnosis(result.assets[0].uri);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    if (currentStep === 0) return !!selectedServiceId;
    if (currentStep === 1) return title.trim().length >= 5 && description.trim().length >= 10;
    if (currentStep === 2) return true;
    if (currentStep === 3) return !!selectedServiceId && title.trim().length >= 5 && description.trim().length >= 10;
    return true;
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else router.back();
  };

  const goToStep = (step: number) => setCurrentStep(step);

  const handleSubmit = async () => {
    const finalServiceId = selectedServiceId || serviceId;
    if (!finalServiceId || !title.trim() || !description.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      let mediaUrls: string[] = [];
      if (photos.length > 0) {
        let failedCount = 0;
        for (let i = 0; i < photos.length; i++) {
          setUploadProgress(`Upload photo ${i + 1}/${photos.length}...`);
          try {
            const uploadResult = await uploadsApi.uploadImage(photos[i], 'service-requests');
            mediaUrls.push(uploadResult.data.data.url);
          } catch {
            failedCount++;
          }
        }
        if (failedCount > 0 && mediaUrls.length === 0) {
          Alert.alert('Erreur', 'Les photos n\'ont pas pu être envoyées.');
          setIsSubmitting(false);
          setUploadProgress(null);
          return;
        }
        setUploadProgress(null);
      }

      setUploadProgress('Publication...');
      const urgencyFromDate: UrgencyLevel = dateMode === 'asap' ? 'HIGH' : urgency;

      let resolvedAddressId: string | undefined;
      let resolvedLatitude: number | undefined;
      let resolvedLongitude: number | undefined;

      if (selectedAddressId) {
        const selectedAddr = savedAddresses?.find((a) => a.id === selectedAddressId);
        if (selectedAddr) {
          resolvedAddressId = selectedAddr.id;
          resolvedLatitude = selectedAddr.latitude ?? undefined;
          resolvedLongitude = selectedAddr.longitude ?? undefined;
        }
      } else if (_location) {
        resolvedLatitude = _location.latitude;
        resolvedLongitude = _location.longitude;
      }

      const result = await createRequest.mutateAsync({
        serviceId: finalServiceId,
        title: title.trim(),
        description: description.trim(),
        urgency: urgencyFromDate,
        addressId: resolvedAddressId,
        latitude: resolvedLatitude,
        longitude: resolvedLongitude,
        preferredDate: dateMode === 'choose' && computedDate ? computedDate : undefined,
        preferredTimeStart: preferredTimeStart || undefined,
        preferredTimeEnd: preferredTimeEnd || undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      });

      setUploadProgress(null);
      if (result?.id) {
        router.replace({ pathname: '/(client)/request-detail', params: { id: result.id } });
      } else {
        router.replace('/(client)/(tabs)/home');
      }
    } catch (err) {
      setUploadProgress(null);
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
            <Text variant="caption" color={colors.primary}>Pro</Text>
          </Pressable>
        )}
      </View>

      {/* Improved Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((step, i) => {
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          const isLast = i === STEPS.length - 1;
          return (
            <View key={step.key} style={styles.stepItem}>
              <View style={styles.stepRow}>
                <Pressable
                  style={[
                    styles.stepCircle,
                    isActive && styles.stepCircleActive,
                    isCompleted && styles.stepCircleCompleted,
                  ]}
                  onPress={() => isCompleted && goToStep(i)}
                  disabled={!isCompleted}
                  accessibilityRole="button"
                  accessibilityLabel={`${step.label}${isCompleted ? ' (terminé)' : isActive ? ' (en cours)' : ''}`}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                  ) : (
                    <Ionicons
                      name={step.icon}
                      size={14}
                      color={isActive ? colors.textInverse : colors.textTertiary}
                    />
                  )}
                </Pressable>
                {!isLast && (
                  <View style={[styles.stepLine, isCompleted && styles.stepLineActive]} />
                )}
              </View>
              <Text
                variant="caption"
                color={isActive ? colors.primary : isCompleted ? colors.success : colors.textTertiary}
                style={[styles.stepLabel, isActive && styles.stepLabelActive]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${((currentStep + 1) / STEPS.length) * 100}%` }]} />
        </View>
        <Text variant="caption" color={colors.textTertiary} style={styles.progressText}>
          {currentStep + 1} sur {STEPS.length}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onScrollBeginDrag={() => showBudgetDropdown && setShowBudgetDropdown(false)}>

        {/* ============================================================ */}
        {/* STEP 1 — SERVICE / CATÉGORIE                                  */}
        {/* ============================================================ */}
        {currentStep === 0 && (
          <>
            <View style={styles.infoBanner}>
              <View style={styles.infoBannerIcon}>
                <Ionicons name="construct-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoBannerText}>
                <Text variant="bodyMedium">Quel service recherchez-vous ?</Text>
                <Text variant="bodySmall" color={colors.textSecondary}>
                  Sélectionnez la catégorie puis le service.
                </Text>
              </View>
            </View>

            {/* Categories */}
            <View style={styles.section}>
              <Text variant="bodyMedium" style={styles.sectionLabel}>Catégorie</Text>
              {categoriesLoading ? (
                <View style={styles.skeletonGrid}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} width="48%" height={56} style={styles.skeletonCard} />
                  ))}
                </View>
              ) : categoriesError ? (
                <View style={styles.inlineError}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                  <Text variant="bodySmall" color={colors.error}>Impossible de charger les catégories</Text>
                  <Pressable onPress={() => refetchCategories()} accessibilityRole="button">
                    <Text variant="bodySmall" color={colors.primary} style={styles.retryLink}>Réessayer</Text>
                  </Pressable>
                </View>
              ) : categories && categories.length > 0 ? (
                <View style={styles.categoryGrid}>
                  {categories.filter((c) => c.isActive).map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={[styles.categoryCard, selectedCategoryId === cat.id && styles.categoryCardActive]}
                      onPress={() => handleCategorySelect(cat.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: selectedCategoryId === cat.id }}
                      accessibilityLabel={cat.name}
                    >
                      <Ionicons
                        name={(STEP_ICONS[cat.name] || 'folder-outline') as any}
                        size={22}
                        color={selectedCategoryId === cat.id ? colors.secondary : colors.textSecondary}
                      />
                      <Text
                        variant="caption"
                        color={selectedCategoryId === cat.id ? colors.primary : colors.text}
                        numberOfLines={2}
                        style={styles.categoryCardText}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Services for selected category */}
            {selectedCategoryId && (
              <View style={styles.section}>
                <Text variant="bodyMedium" style={styles.sectionLabel}>Service</Text>
                {servicesLoading ? (
                  <View style={styles.servicesList}>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} width="100%" height={52} style={styles.skeletonServiceRow} />
                    ))}
                  </View>
                ) : services && services.length > 0 ? (
                  <View style={styles.servicesList}>
                    {services.filter((s) => s.isActive).map((svc) => (
                      <Pressable
                        key={svc.id}
                        style={[styles.serviceRow, selectedServiceId === svc.id && styles.serviceRowActive]}
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
                            <Text variant="body" color={selectedServiceId === svc.id ? colors.primary : colors.text} numberOfLines={1}>
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
                ) : (
                  <View style={styles.inlineEmpty}>
                    <Ionicons name="file-tray-outline" size={24} color={colors.textTertiary} />
                    <Text variant="bodySmall" color={colors.textTertiary}>{messages.empty.noCategoryServices}</Text>
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
                  onPress={() => setSelectedCategoryId(preselectedService.subcategory?.categoryId)}
                  accessibilityRole="button"
                >
                  <Text variant="bodySmall" color={colors.primary}>Changer de service</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* STEP 2 — DÉTAILS (Titre, Description, Photos, Date, Budget)  */}
        {/* ============================================================ */}
        {currentStep === 1 && (
          <>
            <View style={styles.infoBanner}>
              <View style={styles.infoBannerIcon}>
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoBannerText}>
                <Text variant="bodyMedium">Décrivez votre besoin</Text>
                <Text variant="bodySmall" color={colors.textSecondary}>
                  Plus c'est précis, plus les devis seront adaptés.
                </Text>
              </View>
            </View>

            {/* Title */}
            <View style={styles.section}>
              <Text variant="bodyMedium" style={styles.sectionLabel}>Titre de votre demande</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Réparation de fuite à Cocody"
                placeholderTextColor={colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                maxLength={80}
                accessibilityLabel="Titre"
              />
              <Text variant="caption" color={colors.textTertiary} style={styles.charCount}>
                {title.length}/80
              </Text>
            </View>

            {/* Description */}
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
                accessibilityLabel="Description"
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

            {/* Photos */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text variant="bodyMedium">Photos</Text>
                <Text variant="bodySmall" color={colors.textTertiary}> (optionnel)</Text>
              </View>
              <Text variant="bodySmall" color={colors.textSecondary} style={styles.sectionSubtitle}>
                Ajoutez des photos pour aider les professionnels à mieux comprendre.
              </Text>
              {photos.length === 0 ? (
                <Pressable style={styles.photoUploadArea} onPress={pickImages} accessibilityLabel="Ajouter des photos" accessibilityRole="button">
                  <Ionicons name="images-outline" size={32} color={colors.textTertiary} />
                  <Text variant="body" color={colors.text}>Ajouter des photos</Text>
                  <Text variant="caption" color={colors.textTertiary}>Jusqu'à 5 photos • JPG, PNG (5Mo max)</Text>
                </Pressable>
              ) : (
                <View style={styles.photoGrid}>
                  {photos.map((photo, i) => (
                    <View key={i} style={styles.photoItem}>
                      <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                      <Pressable style={styles.removePhotoBtn} onPress={() => removePhoto(i)} accessibilityLabel="Supprimer" accessibilityRole="button">
                        <Ionicons name="close-circle" size={20} color={colors.error} />
                      </Pressable>
                    </View>
                  ))}
                  {photos.length < 5 && (
                    <Pressable style={styles.addMorePhotoBtn} onPress={pickImages} accessibilityLabel="Ajouter" accessibilityRole="button">
                      <Ionicons name="add" size={24} color={colors.primary} />
                    </Pressable>
                  )}
                </View>
              )}
              <View style={styles.photoTags}>
                {PHOTO_TAGS.map((tag) => (
                  <Pressable key={tag.label} style={styles.photoTag} onPress={() => handleTagPress(tag.label)} accessibilityLabel={tag.label} accessibilityRole="button">
                    <View style={styles.photoTagIcon}>
                      <Ionicons name={tag.icon} size={20} color={colors.primary} />
                    </View>
                    <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>{tag.label}</Text>
                  </Pressable>
                ))}
              </View>
              {diagnosisLoading && (
                <View style={styles.diagnosisBanner}>
                  <LottieAnimation source={require('../../../lotties/Settings.json')} autoPlay loop style={styles.inlineLottie} fallbackIcon="hourglass-outline" fallbackSize={24} />
                  <Text variant="bodySmall" color={colors.textSecondary}>Analyse de votre photo...</Text>
                </View>
              )}
              {diagnosis && !diagnosisLoading && diagnosis.confidence > 0 && (
                <View style={styles.diagnosisBanner}>
                  <Ionicons name="sparkles" size={18} color={colors.primary} />
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <Text variant="bodySmall" color={colors.primary}>Suggestion IA</Text>
                    <Text variant="bodySmall" color={colors.text}>{diagnosis.issue}</Text>
                    <Text variant="caption" color={colors.textTertiary}>
                      {diagnosis.category} • Confiance {Math.round(diagnosis.confidence * 100)}%
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Date */}
            <View style={styles.section}>
              <Text variant="bodyMedium" style={styles.sectionLabel}>Quand avez-vous besoin du service ?</Text>
              <View style={styles.dateToggleRow}>
                <Pressable
                  style={[styles.dateToggle, dateMode === 'asap' && styles.dateToggleActive]}
                  onPress={() => { setDateMode('asap'); setPreferredDate(''); }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: dateMode === 'asap' }}
                >
                  <Ionicons name="flash-outline" size={18} color={dateMode === 'asap' ? colors.secondary : colors.textSecondary} />
                  <Text variant="bodySmall" color={dateMode === 'asap' ? colors.text : colors.textSecondary}>
                    Dès que possible
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.dateToggle, dateMode === 'choose' && styles.dateToggleActive]}
                  onPress={() => setDateMode('choose')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: dateMode === 'choose' }}
                >
                  <Ionicons name="calendar-outline" size={18} color={dateMode === 'choose' ? colors.secondary : colors.textSecondary} />
                  <Text variant="bodySmall" color={dateMode === 'choose' ? colors.text : colors.textSecondary}>
                    Choisir une date
                  </Text>
                </Pressable>
              </View>
              {dateMode === 'choose' && (
                <View style={styles.dateChipsContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateChipsScroll}>
                    {DATE_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.key}
                        style={[styles.dateChip, dateOption === opt.key && styles.dateChipActive]}
                        onPress={() => { setDateOption(opt.key); if (opt.key !== 'custom' && opt.key !== 'free') setPreferredDate(''); }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: dateOption === opt.key }}
                      >
                        <Ionicons name={opt.icon} size={14} color={dateOption === opt.key ? colors.primary : colors.textTertiary} />
                        <Text variant="caption" color={dateOption === opt.key ? colors.primary : colors.textSecondary}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  {(dateOption === 'custom' || dateOption === 'free') && (
                    <TextInput
                      style={[styles.input, { marginTop: spacing.md }]}
                      placeholder="AAAA-MM-JJ"
                      placeholderTextColor={colors.textTertiary}
                      value={preferredDate}
                      onChangeText={setPreferredDate}
                      accessibilityLabel="Date préférée"
                    />
                  )}
                </View>
              )}
            </View>

            {/* Budget */}
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
              <Pressable style={styles.dropdown} onPress={() => setShowBudgetDropdown(!showBudgetDropdown)} accessibilityRole="button">
                <Text variant="body" color={budgetRange ? colors.text : colors.textTertiary}>
                  {budgetRange ? BUDGET_RANGES.find(b => b.value === budgetRange)?.label : 'Sélectionnez une plage'}
                </Text>
                <Ionicons name={showBudgetDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textTertiary} />
              </Pressable>
              {showBudgetDropdown && (
                <View style={styles.dropdownList}>
                  {BUDGET_RANGES.map((range) => (
                    <Pressable
                      key={range.value}
                      style={[styles.dropdownItem, budgetRange === range.value && styles.dropdownItemActive]}
                      onPress={() => { setBudgetRange(range.value); setShowBudgetDropdown(false); }}
                      accessibilityRole="menuitem"
                    >
                      <Text variant="body" color={budgetRange === range.value ? colors.primary : colors.text}>
                        {range.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {error && <Text variant="bodySmall" color={colors.error} style={styles.errorText}>{error}</Text>}
          </>
        )}

        {/* ============================================================ */}
        {/* STEP 3 — LOCALISATION                                         */}
        {/* ============================================================ */}
        {currentStep === 2 && (
          <>
            <View style={styles.infoBanner}>
              <View style={styles.infoBannerIcon}>
                <Ionicons name="location-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.infoBannerText}>
                <Text variant="bodyMedium">Où se déroule le service ?</Text>
                <Text variant="bodySmall" color={colors.textSecondary}>
                  Cette information aide les professionnels à proximité.
                </Text>
              </View>
            </View>

            {/* GPS detected */}
            {detectedAddress?.formattedAddress && !selectedAddressId && (
              <View style={styles.section}>
                <View style={styles.gpsDetected}>
                  <Ionicons name="navigate" size={18} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodySmall" color={colors.success} style={{ fontWeight: '600' }}>Position GPS détectée</Text>
                    <Text variant="bodySmall" color={colors.textSecondary}>{detectedAddress.formattedAddress}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                </View>
                <Text variant="caption" color={colors.textTertiary} style={{ marginTop: spacing.sm }}>
                  La position GPS sera utilisée pour la demande. Vous pouvez choisir une adresse enregistrée ci-dessous.
                </Text>
              </View>
            )}
            {locationLoading && !detectedAddress && (
              <View style={styles.section}>
                <View style={styles.gpsDetected}>
                  <LottieAnimation source={require('../../../lotties/Settings.json')} autoPlay loop style={styles.inlineLottie} fallbackIcon="hourglass-outline" fallbackSize={24} />
                  <Text variant="bodySmall" color={colors.textTertiary}>Détection de votre position...</Text>
                </View>
              </View>
            )}

            {/* Saved addresses */}
            {savedAddresses && savedAddresses.length > 0 && (
              <View style={styles.section}>
                <Text variant="bodyMedium" style={styles.sectionLabel}>Adresses enregistrées</Text>
                {savedAddresses.map((addr) => (
                  <Pressable
                    key={addr.id}
                    style={[styles.addressCard, selectedAddressId === addr.id && styles.addressCardActive]}
                    onPress={() => {
                      setSelectedAddressId(selectedAddressId === addr.id ? undefined : addr.id);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedAddressId === addr.id }}
                  >
                    <Ionicons
                      name={addr.label === 'Maison' ? 'home-outline' : addr.label === 'Bureau' ? 'briefcase-outline' : 'location-outline'}
                      size={20}
                      color={selectedAddressId === addr.id ? colors.primary : colors.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" color={selectedAddressId === addr.id ? colors.primary : colors.text} style={{ fontWeight: '600' }}>
                        {addr.label || 'Adresse'}
                      </Text>
                      <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>{addr.fullAddress}</Text>
                    </View>
                    <Ionicons
                      name={selectedAddressId === addr.id ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={selectedAddressId === addr.id ? colors.primary : colors.textTertiary}
                    />
                  </Pressable>
                ))}
                <Pressable style={styles.addAddressLink} onPress={() => router.push('/(client)/addresses')} accessibilityRole="button">
                  <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                  <Text variant="caption" color={colors.primary}>Gérer mes adresses</Text>
                </Pressable>
              </View>
            )}

            {/* Manual geography */}
            <View style={styles.section}>
              <Text variant="bodyMedium" style={styles.sectionLabel}>Ou sélectionnez manuellement</Text>

              {/* Country */}
              <View style={styles.geoField}>
                <Text variant="caption" color={colors.textSecondary}>Pays</Text>
                {countriesLoading ? <Skeleton width="100%" height={40} /> : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.geoChipScroll}>
                    {countries?.map((country) => (
                      <Pressable
                        key={country.id}
                        style={[styles.geoChip, selectedCountryId === country.id && styles.geoChipActive]}
                        onPress={() => { setSelectedCountryId(country.id); setSelectedRegionId(undefined); setSelectedCityId(undefined); setSelectedDistrictId(undefined); setSelectedAddressId(undefined); }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: selectedCountryId === country.id }}
                      >
                        <Text variant="caption" color={selectedCountryId === country.id ? colors.primary : colors.textSecondary}>{country.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Region */}
              {selectedCountryId && (
                <View style={styles.geoField}>
                  <Text variant="caption" color={colors.textSecondary}>Région</Text>
                  {regionsLoading ? <Skeleton width="100%" height={40} /> : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.geoChipScroll}>
                      {regions?.map((region) => (
                        <Pressable
                          key={region.id}
                          style={[styles.geoChip, selectedRegionId === region.id && styles.geoChipActive]}
                          onPress={() => { setSelectedRegionId(region.id); setSelectedCityId(undefined); setSelectedDistrictId(undefined); setSelectedAddressId(undefined); }}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: selectedRegionId === region.id }}
                        >
                          <Text variant="caption" color={selectedRegionId === region.id ? colors.primary : colors.textSecondary}>{region.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              {/* City */}
              {selectedRegionId && (
                <View style={styles.geoField}>
                  <Text variant="caption" color={colors.textSecondary}>Ville</Text>
                  {citiesLoading ? <Skeleton width="100%" height={40} /> : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.geoChipScroll}>
                      {cities?.map((city) => (
                        <Pressable
                          key={city.id}
                          style={[styles.geoChip, selectedCityId === city.id && styles.geoChipActive]}
                          onPress={() => { setSelectedCityId(city.id); setSelectedDistrictId(undefined); setSelectedAddressId(undefined); }}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: selectedCityId === city.id }}
                        >
                          <Text variant="caption" color={selectedCityId === city.id ? colors.primary : colors.textSecondary}>{city.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              {/* District */}
              {selectedCityId && (
                <View style={styles.geoField}>
                  <Text variant="caption" color={colors.textSecondary}>Commune / Quartier</Text>
                  {districtsLoading ? <Skeleton width="100%" height={40} /> : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.geoChipScroll}>
                      {districts?.map((district) => (
                        <Pressable
                          key={district.id}
                          style={[styles.geoChip, selectedDistrictId === district.id && styles.geoChipActive]}
                          onPress={() => { setSelectedDistrictId(district.id); setSelectedAddressId(undefined); }}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: selectedDistrictId === district.id }}
                        >
                          <Text variant="caption" color={selectedDistrictId === district.id ? colors.primary : colors.textSecondary}>{district.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>

            {/* Time */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text variant="bodyMedium">Créneaux préférés</Text>
                <Text variant="bodySmall" color={colors.textTertiary}> (optionnel)</Text>
              </View>
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text variant="caption" color={colors.textSecondary}>De</Text>
                  <TextInput style={styles.input} placeholder="08:00" placeholderTextColor={colors.textTertiary} value={preferredTimeStart} onChangeText={setPreferredTimeStart} accessibilityLabel="Heure de début" />
                </View>
                <View style={styles.timeField}>
                  <Text variant="caption" color={colors.textSecondary}>À</Text>
                  <TextInput style={styles.input} placeholder="18:00" placeholderTextColor={colors.textTertiary} value={preferredTimeEnd} onChangeText={setPreferredTimeEnd} accessibilityLabel="Heure de fin" />
                </View>
              </View>
            </View>
          </>
        )}

        {/* ============================================================ */}
        {/* STEP 4 — CONFIRMATION                                         */}
        {/* ============================================================ */}
        {currentStep === 3 && (
          <>
            <View style={styles.infoBanner}>
              <View style={styles.infoBannerIcon}>
                <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
              </View>
              <View style={styles.infoBannerText}>
                <Text variant="bodyMedium">Vérifiez votre demande</Text>
                <Text variant="bodySmall" color={colors.textSecondary}>
                  Relisez les informations avant de publier.
                </Text>
              </View>
            </View>

            {/* Service */}
            <View style={styles.section}>
              <View style={styles.summaryHeader}>
                <Ionicons name="construct-outline" size={18} color={colors.primary} />
                <Text variant="bodyMedium" style={styles.summaryTitle}>Service</Text>
                <Pressable onPress={() => goToStep(0)} accessibilityRole="button" style={styles.editBtn}>
                  <Text variant="caption" color={colors.primary}>Modifier</Text>
                </Pressable>
              </View>
              {selectedCategory && <Text variant="bodySmall" color={colors.textSecondary}>{selectedCategory.name}</Text>}
              <Text variant="body" color={colors.text}>{selectedService?.name || '—'}</Text>
            </View>

            {/* Details */}
            <View style={styles.section}>
              <View style={styles.summaryHeader}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                <Text variant="bodyMedium" style={styles.summaryTitle}>Détails</Text>
                <Pressable onPress={() => goToStep(1)} accessibilityRole="button" style={styles.editBtn}>
                  <Text variant="caption" color={colors.primary}>Modifier</Text>
                </Pressable>
              </View>
              <Text variant="bodyMedium" color={colors.text}>{title || '—'}</Text>
              <Text variant="bodySmall" color={colors.textSecondary} numberOfLines={4}>{description || '—'}</Text>
              {photos.length > 0 && (
                <View style={styles.summaryPhotos}>
                  {photos.map((photo, i) => (
                    <Image key={i} source={{ uri: photo.uri }} style={styles.summaryPhotoThumb} />
                  ))}
                </View>
              )}
            </View>

            {/* Date */}
            <View style={styles.section}>
              <View style={styles.summaryHeader}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text variant="bodyMedium" style={styles.summaryTitle}>Date et urgence</Text>
                <Pressable onPress={() => goToStep(1)} accessibilityRole="button" style={styles.editBtn}>
                  <Text variant="caption" color={colors.primary}>Modifier</Text>
                </Pressable>
              </View>
              <Text variant="body" color={colors.text}>
                {dateMode === 'asap' ? 'Dès que possible' : (dateOption === 'custom' || dateOption === 'free') && preferredDate ? preferredDate : DATE_OPTIONS.find((o) => o.key === dateOption)?.label || 'Date non précisée'}
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Urgence : {dateMode === 'asap' ? 'Élevée' : 'Normale'}
              </Text>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <View style={styles.summaryHeader}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <Text variant="bodyMedium" style={styles.summaryTitle}>Localisation</Text>
                <Pressable onPress={() => goToStep(2)} accessibilityRole="button" style={styles.editBtn}>
                  <Text variant="caption" color={colors.primary}>Modifier</Text>
                </Pressable>
              </View>
              {selectedAddressId ? (
                <Text variant="body" color={colors.text}>
                  {savedAddresses?.find((a) => a.id === selectedAddressId)?.fullAddress || 'Adresse enregistrée'}
                </Text>
              ) : detectedAddress?.formattedAddress ? (
                <Text variant="body" color={colors.text}>{detectedAddress.formattedAddress}</Text>
              ) : (selectedCity || selectedDistrict) ? (
                <Text variant="body" color={colors.text}>
                  {[selectedDistrict?.name, selectedCity?.name, selectedRegion?.name, selectedCountry?.name].filter(Boolean).join(', ')}
                </Text>
              ) : (
                <Text variant="body" color={colors.textTertiary}>Non renseignée</Text>
              )}
            </View>

            {/* Time */}
            {(preferredTimeStart || preferredTimeEnd) && (
              <View style={styles.section}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text variant="bodyMedium" style={styles.summaryTitle}>Créneaux</Text>
                  <Pressable onPress={() => goToStep(2)} accessibilityRole="button" style={styles.editBtn}>
                    <Text variant="caption" color={colors.primary}>Modifier</Text>
                  </Pressable>
                </View>
                <Text variant="body" color={colors.text}>{preferredTimeStart || '—'} → {preferredTimeEnd || '—'}</Text>
              </View>
            )}

            {/* Budget */}
            {budgetRange && (
              <View style={styles.section}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="wallet-outline" size={18} color={colors.primary} />
                  <Text variant="bodyMedium" style={styles.summaryTitle}>Budget indicatif</Text>
                  <Pressable onPress={() => goToStep(1)} accessibilityRole="button" style={styles.editBtn}>
                    <Text variant="caption" color={colors.primary}>Modifier</Text>
                  </Pressable>
                </View>
                <Text variant="body" color={colors.text}>{BUDGET_RANGES.find(b => b.value === budgetRange)?.label}</Text>
                <Text variant="caption" color={colors.warning} style={{ marginTop: spacing.xs }}>
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
        {uploadProgress && (
          <View style={styles.uploadProgressBar}>
            <LottieAnimation source={require('../../../lotties/Settings.json')} autoPlay loop style={styles.inlineLottie} fallbackIcon="hourglass-outline" fallbackSize={24} />
            <Text variant="caption" color={colors.textSecondary}>{uploadProgress}</Text>
          </View>
        )}
        <Pressable
          style={[styles.ctaButton, !canProceed() && styles.ctaButtonDisabled]}
          onPress={currentStep === STEPS.length - 1 ? handleSubmit : goNext}
          disabled={!canProceed() || isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={currentStep === STEPS.length - 1 ? 'Confirmer et publier' : messages.common.continue}
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
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, marginLeft: spacing.xs },
  proChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, gap: spacing.xs },

  // Stepper
  stepper: { flexDirection: 'row', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', flex: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border },
  stepCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepCircleCompleted: { backgroundColor: colors.success, borderColor: colors.success },
  stepNumber: {},
  stepLine: { position: 'absolute', left: '64%', right: '-36%', height: 2, backgroundColor: colors.border, top: 15 },
  stepLineActive: { backgroundColor: colors.success },
  stepLabel: { marginTop: spacing.xs, fontSize: 10 },
  stepLabelActive: { fontWeight: '700' },

  // Progress bar
  progressBarContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.md, gap: spacing.sm },
  progressBarBg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceSecondary },
  progressBarFill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
  progressText: { fontSize: 10 },

  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: 100 },

  // Info banner
  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg, gap: spacing.md, ...shadows.sm },
  infoBannerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  infoBannerText: { flex: 1, gap: spacing.xxs },

  // Estimate
  estimateBanner: { backgroundColor: colors.secondaryMuted, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs, borderWidth: 1, borderColor: colors.secondary + '30' },
  estimateHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  estimateMedian: { marginTop: spacing.xs },

  // Sections
  section: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.sm },
  sectionLabel: { marginBottom: spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'baseline' },
  sectionSubtitle: { marginBottom: spacing.md },

  // Inputs
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 16, color: colors.text, backgroundColor: colors.background },
  textarea: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 16, color: colors.text, backgroundColor: colors.background, minHeight: 120 },
  charCount: { textAlign: 'right', marginTop: spacing.xs },

  // Photos
  photoUploadArea: { borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: spacing.xxl, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.background },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  photoItem: { position: 'relative' },
  photoThumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary },
  removePhotoBtn: { position: 'absolute', top: -6, right: -6 },
  addMorePhotoBtn: { width: 72, height: 72, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  photoTags: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  photoTag: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  photoTagIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  diagnosisBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.primaryLight + '10', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, gap: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.primary },
  inlineLottie: { width: 24, height: 24 },

  // Categories
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryCard: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  categoryCardActive: { backgroundColor: colors.goldTint, borderColor: colors.primary },
  categoryCardText: { flex: 1, fontWeight: '500' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skeletonCard: { borderRadius: radius.md },

  // Services
  servicesList: { gap: spacing.sm },
  serviceRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  serviceRowActive: { backgroundColor: colors.goldTint, borderColor: colors.primary },
  serviceRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  serviceRowInfo: { flex: 1, gap: 2 },
  serviceRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  serviceRadioActive: { borderColor: colors.primary },
  serviceRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  skeletonServiceRow: { borderRadius: radius.md },

  // Preselected
  preselectedBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.successLight, borderRadius: radius.md, marginBottom: spacing.md },
  preselectedInfo: { flex: 1, gap: 2 },
  changeServiceBtn: { paddingVertical: spacing.sm },

  // Date
  dateToggleRow: { flexDirection: 'row', gap: spacing.sm },
  dateToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  dateToggleActive: { borderColor: colors.primary, backgroundColor: colors.goldTint },
  dateChipsContainer: { marginTop: spacing.md },
  dateChipsScroll: { gap: spacing.sm },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  dateChipActive: { borderColor: colors.primary, backgroundColor: colors.goldTint },

  // Budget
  budgetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  budgetIconWrap: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.secondaryMuted, alignItems: 'center', justifyContent: 'center' },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.background },
  dropdownList: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginTop: spacing.sm, backgroundColor: colors.surface, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dropdownItemActive: { backgroundColor: colors.goldTint },

  // Location
  gpsDetected: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.successLight, borderRadius: radius.md },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  addressCardActive: { borderColor: colors.primary, backgroundColor: colors.goldTint },
  addAddressLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },

  // Geography
  geoField: { marginBottom: spacing.md },
  geoChipScroll: { marginTop: spacing.sm },
  geoChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm, backgroundColor: colors.background },
  geoChipActive: { borderColor: colors.primary, backgroundColor: colors.goldTint },

  // Time
  timeRow: { flexDirection: 'row', gap: spacing.md },
  timeField: { flex: 1, gap: spacing.xs },

  // Confirmation summary
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  summaryTitle: { flex: 1, fontWeight: '600' },
  editBtn: { paddingVertical: spacing.xs },
  summaryPhotos: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  summaryPhotoThumb: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.surfaceSecondary },

  // Errors
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.errorLight, borderRadius: radius.md },
  inlineEmpty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  retryLink: { fontWeight: '600' },
  errorText: { textAlign: 'center', marginTop: spacing.md },
  submitError: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.errorLight, borderRadius: radius.md, marginTop: spacing.md },
  submitErrorText: { flex: 1 },

  // Footer
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  uploadProgressBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  ctaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: radius.full, ...shadows.md },
  ctaButtonDisabled: { opacity: 0.5 },
});
