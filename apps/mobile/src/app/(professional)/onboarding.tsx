import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Button } from '@/components/ui';
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
  const { data: user } = useMe();
  const { data: profile } = useMyProfessionalProfile();
  const { data: categories } = useCategories();
  const createProfile = useCreateProfessionalProfile();
  const updateProfile = useUpdateProfessionalProfile();

  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState(profile?.businessName || '');
  const [description, setDescription] = useState(profile?.description || '');
  const [experienceYears, setExperienceYears] = useState(String(profile?.experienceYears || ''));
  const [selectedServices, setSelectedServices] = useState<string[]>(
    profile?.services?.map((s) => s.id) || [],
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  const { data: services } = useServices(selectedCategoryId ? { categoryId: selectedCategoryId } : undefined);

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

  const handleNext = async () => {
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

    if (profile) {
      await updateProfile.mutateAsync({ id: profile.id, ...payload });
    } else {
      await createProfile.mutateAsync(payload);
    }
    router.replace('/(professional)/(tabs)/dashboard' as never);
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {step > 0 ? (
          <Pressable onPress={() => setStep(step - 1)} accessibilityLabel="Retour" style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        ) : (
          <Pressable onPress={() => router.back()} accessibilityLabel="Fermer" style={styles.backBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        )}
        <Text variant="bodySmall" color={colors.textSecondary}>
          {step + 1} / {STEPS.length}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
              accessibilityLabel="Description"
            />
            <Text variant="bodySmall" color={colors.textTertiary} align="right">
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
              accessibilityLabel="Années d'expérience"
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text variant="h2">Services</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Sélectionnez les services que vous proposez.
            </Text>

            {categories && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipActive]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <Text variant="bodySmall" color={selectedCategoryId === cat.id ? colors.textInverse : colors.text}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {services && services.map((svc) => (
              <Pressable
                key={svc.id}
                style={[styles.serviceItem, selectedServices.includes(svc.id) && styles.serviceItemActive]}
                onPress={() => toggleService(svc.id)}
              >
                <Ionicons
                  name={selectedServices.includes(svc.id) ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={selectedServices.includes(svc.id) ? colors.primary : colors.textTertiary}
                />
                <Text variant="body">{svc.name}</Text>
              </Pressable>
            ))}

            {selectedServices.length > 0 && (
              <Text variant="bodySmall" color={colors.primary}>
                {selectedServices.length} service(s) sélectionné(s)
              </Text>
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
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={createProfile.isPending || updateProfile.isPending
            ? 'Envoi...'
            : isLastStep
              ? (profile ? 'Mettre à jour' : 'Créer mon profil')
              : 'Suivant'}
          onPress={handleNext}
          disabled={!canProceed || createProfile.isPending || updateProfile.isPending}
        />
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text variant="bodySmall" color={colors.textSecondary}>{label}</Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progressBar: { height: 3, backgroundColor: colors.borderLight, marginHorizontal: spacing.lg },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxxl },
  stepContent: { gap: spacing.md },
  input: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 16, color: colors.text },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  categoryScroll: { flexGrow: 0, marginVertical: spacing.sm },
  categoryChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surfaceSecondary, marginRight: spacing.sm },
  categoryChipActive: { backgroundColor: colors.primary },
  serviceItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  serviceItemActive: {},
  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  summaryRow: { gap: 2 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
});
