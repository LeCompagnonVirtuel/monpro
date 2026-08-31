import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Button, Input } from '@/components/ui';
import { uploadsApi } from '@/api/uploads';
import { kycApi, KycDocumentType } from '@/api/kyc';

const TOTAL_STEPS = 6;

interface DocumentOption {
  type: KycDocumentType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  needsBack: boolean;
}

const DOCUMENT_OPTIONS: DocumentOption[] = [
  { type: 'CNI', label: 'Carte nationale d\'identité', icon: 'card-outline', needsBack: true },
  { type: 'PASSPORT', label: 'Passeport', icon: 'book-outline', needsBack: false },
  { type: 'DRIVER_LICENSE', label: 'Permis de conduire', icon: 'car-outline', needsBack: true },
  { type: 'BUSINESS_REGISTRATION', label: 'Registre du commerce', icon: 'business-outline', needsBack: false },
];

export default function KycScreen() {
  const [step, setStep] = useState(0);
  const [documentType, setDocumentType] = useState<KycDocumentType | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedOption = DOCUMENT_OPTIONS.find((o) => o.type === documentType);
  const needsBack = selectedOption?.needsBack ?? true;

  const pickImage = async (onResult: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'accès à vos photos pour continuer.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      onResult(result.assets[0].uri);
    }
  };

  const takePhoto = async (onResult: (uri: string) => void) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'accès à l\'appareil photo pour continuer.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      onResult(result.assets[0].uri);
    }
  };

  const showImageOptions = (onResult: (uri: string) => void) => {
    Alert.alert('Choisir une photo', 'Sélectionnez une source', [
      { text: 'Appareil photo', onPress: () => takePhoto(onResult) },
      { text: 'Galerie', onPress: () => pickImage(onResult) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const needsSkip = !needsBack && step === 4;
  const canProceed = (() => {
    switch (step) {
      case 0: return documentType !== null;
      case 1: return documentNumber.trim().length >= 3;
      case 2: return frontUri !== null;
      case 3: return needsBack ? backUri !== null : true;
      case 4: return selfieUri !== null;
      default: return true;
    }
  })();

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }

    await handleSubmit();
  };

  const handleSubmit = async () => {
    if (!documentType || !documentNumber || !frontUri || !selfieUri) return;

    setSubmitting(true);
    try {
      setUploading(true);
      const frontFile = { uri: frontUri, name: 'front.jpg', type: 'image/jpeg' };
      const frontRes = await uploadsApi.uploadImage(frontFile, 'kyc');
      const frontUrl = frontRes.data.data.url;

      let backUrl: string | undefined;
      if (backUri) {
        const backFile = { uri: backUri, name: 'back.jpg', type: 'image/jpeg' };
        const backRes = await uploadsApi.uploadImage(backFile, 'kyc');
        backUrl = backRes.data.data.url;
      }

      const selfieFile = { uri: selfieUri, name: 'selfie.jpg', type: 'image/jpeg' };
      const selfieRes = await uploadsApi.uploadImage(selfieFile, 'kyc');
      const selfieUrl = selfieRes.data.data.url;

      setUploading(false);

      await kycApi.submit({
        documentType,
        documentNumber: documentNumber.trim(),
        frontUrl,
        backUrl,
        selfieUrl,
      });

      setStep(TOTAL_STEPS - 1);
    } catch {
      Alert.alert('Erreur', 'Impossible de soumettre vos documents. Veuillez réessayer.');
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 0 && step < TOTAL_STEPS - 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const renderImagePicker = (uri: string | null, onPick: () => void) => (
    <Pressable
      style={[styles.uploadArea, uri && styles.uploadAreaFilled]}
      onPress={uri ? undefined : onPick}
      accessibilityLabel={uri ? 'Photo sélectionnée' : 'Ajouter une photo'}
      accessibilityRole="button"
    >
      {uri ? (
        <Image source={{ uri }} style={styles.uploadPreview} resizeMode="cover" />
      ) : (
        <View style={styles.uploadPlaceholder}>
          <Ionicons name="camera-outline" size={48} color={colors.textTertiary} />
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.uploadHint}>
            Appuyez pour ajouter
          </Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          accessibilityLabel="Retour"
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text
          variant="bodySmall"
          color={colors.textSecondary}
          accessibilityLabel={`Étape ${step + 1} sur ${TOTAL_STEPS}`}
        >
          {step + 1} / {TOTAL_STEPS}
        </Text>
      </View>

      {step < TOTAL_STEPS - 1 && (
        <View
          style={styles.progressBar}
          accessibilityLabel={`Progression : étape ${step + 1} sur ${TOTAL_STEPS}`}
          accessibilityRole="progressbar"
        >
          <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <View style={styles.stepContent}>
            <Text variant="h2">Vérification d'identité</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Choisissez le type de document à vérifier
            </Text>

            <View style={styles.optionsGrid}>
              {DOCUMENT_OPTIONS.map((option) => (
                <Pressable
                  key={option.type}
                  style={[
                    styles.optionCard,
                    documentType === option.type && styles.optionCardActive,
                  ]}
                  onPress={() => setDocumentType(option.type)}
                  accessibilityLabel={option.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: documentType === option.type }}
                >
                  <View style={[
                    styles.optionIconContainer,
                    documentType === option.type && styles.optionIconActive,
                  ]}>
                    <Ionicons
                      name={option.icon}
                      size={28}
                      color={documentType === option.type ? colors.textInverse : colors.primary}
                    />
                  </View>
                  <Text
                    variant="bodySmall"
                    color={documentType === option.type ? colors.primary : colors.text}
                    style={styles.optionLabel}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text variant="h2">Numéro du document</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Saisissez le numéro inscrit sur votre document
            </Text>
            <Input
              placeholder="Ex: CI-12345678"
              value={documentNumber}
              onChangeText={setDocumentNumber}
              autoCapitalize="characters"
              autoFocus
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text variant="h2">Photo du recto</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Prenez une photo claire du recto de votre document
            </Text>
            {renderImagePicker(frontUri, () => showImageOptions(setFrontUri))}
            {frontUri && (
              <Pressable
                onPress={() => showImageOptions(setFrontUri)}
                accessibilityLabel="Changer la photo"
                accessibilityRole="button"
              >
                <Text variant="bodySmall" color={colors.primary} align="center">
                  Changer la photo
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text variant="h2">Photo du verso</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Prenez une photo du verso de votre document
            </Text>
            {renderImagePicker(backUri, () => showImageOptions(setBackUri))}
            {backUri && (
              <Pressable
                onPress={() => showImageOptions(setBackUri)}
                accessibilityLabel="Changer la photo"
                accessibilityRole="button"
              >
                <Text variant="bodySmall" color={colors.primary} align="center">
                  Changer la photo
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContent}>
            <Text variant="h2">Photo de vous-même</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Prenez un selfie pour confirmer votre identité
            </Text>
            {renderImagePicker(selfieUri, () => showImageOptions(setSelfieUri))}
            {selfieUri && (
              <Pressable
                onPress={() => showImageOptions(setSelfieUri)}
                accessibilityLabel="Changer la photo"
                accessibilityRole="button"
              >
                <Text variant="bodySmall" color={colors.primary} align="center">
                  Changer la photo
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {step === TOTAL_STEPS - 1 && (
          <View style={styles.stepContent}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color={colors.success} />
              </View>
              <Text variant="h2" align="center">Documents soumis avec succès</Text>
              <Text variant="body" color={colors.textSecondary} align="center">
                Votre demande de vérification est en cours de traitement.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {step < TOTAL_STEPS - 1 && (
        <View style={styles.footer}>
          {needsSkip ? (
            <View style={styles.footerButtons}>
              <Button
                title={step === 4 ? 'Soumettre' : 'Continuer'}
                onPress={handleNext}
                disabled={!canProceed || submitting}
                loading={submitting}
                style={styles.footerPrimaryBtn}
              />
              <Button
                title="Passer"
                variant="ghost"
                onPress={() => setStep(step + 1)}
                disabled={submitting}
              />
            </View>
          ) : (
            <Button
              title={step === 4 ? 'Soumettre' : 'Continuer'}
              onPress={handleNext}
              disabled={!canProceed || submitting}
              loading={submitting}
            />
          )}
        </View>
      )}

      {step === TOTAL_STEPS - 1 && (
        <View style={styles.footer}>
          <Button
            title="Retour au profil"
            onPress={() => router.back()}
          />
        </View>
      )}

      {uploading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="body" color={colors.text} style={styles.loadingText}>
              Upload en cours...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  progressBar: { height: 3, backgroundColor: colors.borderLight, marginHorizontal: spacing.lg },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxxl },
  stepContent: { gap: spacing.md },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  optionCard: { width: '47%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center', gap: spacing.md, ...shadows.sm },
  optionCardActive: { borderColor: colors.primary, backgroundColor: colors.surfaceSecondary },
  optionIconContainer: { width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  optionIconActive: { backgroundColor: colors.primary },
  optionLabel: { textAlign: 'center', lineHeight: 20 },
  uploadArea: { height: 200, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary },
  uploadAreaFilled: { borderWidth: 0, borderStyle: 'solid' },
  uploadPlaceholder: { alignItems: 'center', gap: spacing.sm },
  uploadHint: { marginTop: spacing.xs },
  uploadPreview: { width: '100%', height: '100%', borderRadius: radius.lg },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  footerButtons: { gap: spacing.sm },
  footerPrimaryBtn: { marginBottom: spacing.xs },
  successContainer: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.lg },
  successIcon: { marginBottom: spacing.sm },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' },
  loadingCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.md, ...shadows.md },
  loadingText: { marginTop: spacing.sm },
});
