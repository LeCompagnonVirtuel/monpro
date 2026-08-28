import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Button } from '@/components/ui';
import { useCreateQuote } from '@/hooks/use-professional-quotes';
import { formatCurrency } from '@/lib/format';

export default function CreateQuoteScreen() {
  const { requestId, serviceName } = useLocalSearchParams<{ requestId: string; serviceName?: string }>();
  const createQuote = useCreateQuote();

  const [laborCost, setLaborCost] = useState('');
  const [materialCost, setMaterialCost] = useState('');
  const [transportCost, setTransportCost] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [validDays, setValidDays] = useState('7');

  const labor = Number(laborCost) || 0;
  const material = Number(materialCost) || 0;
  const transport = Number(transportCost) || 0;
  const total = labor + material + transport;

  const canSubmit = labor > 0 && !!requestId;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;

    Alert.alert(
      'Confirmer le devis',
      `Montant total : ${formatCurrency(total)}\n\nVoulez-vous envoyer ce devis ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            const validUntil = validDays
              ? new Date(Date.now() + Number(validDays) * 86400000).toISOString()
              : undefined;

            try {
              await createQuote.mutateAsync({
                serviceRequestId: requestId!,
                laborCost: labor,
                materialCost: material || undefined,
                transportCost: transport || undefined,
                description: description.trim() || undefined,
                estimatedDuration: estimatedDuration.trim() || undefined,
                validUntil,
              });
              router.back();
            } catch {
              Alert.alert(
                'Erreur',
                'Impossible d\'envoyer votre devis. Veuillez vérifier les informations et réessayer.',
              );
            }
          },
        },
      ],
    );
  }, [canSubmit, total, validDays, requestId, labor, material, transport, description, estimatedDuration, createQuote]);

  if (!requestId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
          <Text variant="body" color={colors.textSecondary} align="center">
            Demande indisponible. Impossible de créer un devis sans demande associée.
          </Text>
          <Button title="Retour" onPress={() => router.back()} variant="outline" size="sm" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header />

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
          {serviceName && (
            <View style={styles.serviceInfo}>
              <Text variant="caption" color={colors.textSecondary}>Service demandé</Text>
              <Text variant="bodyMedium">{serviceName}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text variant="bodyMedium">{"Main-d'œuvre (FCFA) *"}</Text>
            <TextInput
              style={styles.input}
              value={laborCost}
              onChangeText={setLaborCost}
              placeholder="15000"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              accessibilityLabel="Coût main-d'œuvre en francs CFA, champ obligatoire"
            />
          </View>

          <View style={styles.section}>
            <Text variant="bodyMedium">Matériel (FCFA)</Text>
            <TextInput
              style={styles.input}
              value={materialCost}
              onChangeText={setMaterialCost}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              accessibilityLabel="Coût matériel en francs CFA"
            />
          </View>

          <View style={styles.section}>
            <Text variant="bodyMedium">Déplacement (FCFA)</Text>
            <TextInput
              style={styles.input}
              value={transportCost}
              onChangeText={setTransportCost}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              accessibilityLabel="Coût déplacement en francs CFA"
            />
          </View>

          <View style={styles.totalCard}>
            <Text variant="caption" color={colors.textSecondary}>Total estimé</Text>
            <Text variant="h2" color={colors.primary}>{formatCurrency(total)}</Text>
            <Text variant="caption" color={colors.textTertiary}>
              Le montant final sera confirmé par le serveur.
            </Text>
          </View>

          <View style={styles.section}>
            <Text variant="bodyMedium">Délai estimé</Text>
            <TextInput
              style={styles.input}
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              placeholder="Ex: 2 heures, 1 journée..."
              placeholderTextColor={colors.textTertiary}
              accessibilityLabel="Délai estimé pour la réalisation"
            />
          </View>

          <View style={styles.section}>
            <Text variant="bodyMedium">Validité (jours)</Text>
            <TextInput
              style={styles.input}
              value={validDays}
              onChangeText={setValidDays}
              placeholder="7"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              accessibilityLabel="Durée de validité du devis en jours"
            />
          </View>

          <View style={styles.section}>
            <Text variant="bodyMedium">Notes / Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Détails supplémentaires..."
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={500}
              accessibilityLabel="Description du devis"
            />
            <Text variant="caption" color={colors.textTertiary} align="right">
              {description.length}/500
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title={createQuote.isPending ? 'Envoi en cours...' : 'Envoyer le devis'}
          onPress={handleSubmit}
          disabled={!canSubmit || createQuote.isPending}
          loading={createQuote.isPending}
        />
      </View>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Fermer"
        accessibilityRole="button"
        style={styles.backBtn}
      >
        <Ionicons name="close" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Nouveau devis</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxxl },
  serviceInfo: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs, ...shadows.sm },
  section: { gap: spacing.sm },
  input: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 16, color: colors.text, minHeight: 48 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  totalCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', gap: spacing.xs, ...shadows.sm },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: spacing.md },
});
