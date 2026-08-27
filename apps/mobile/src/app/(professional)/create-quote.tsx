import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Button } from '@/components/ui';
import { useCreateQuote } from '@/hooks/use-professional-quotes';
import { formatCurrency } from '@/lib/format';

export default function CreateQuoteScreen() {
  const { requestId, serviceName } = useLocalSearchParams<{ requestId: string; serviceName: string }>();
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

  const handleSubmit = () => {
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
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Fermer" style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text variant="h3" style={styles.headerTitle}>Nouveau devis</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {serviceName && (
          <View style={styles.serviceInfo}>
            <Text variant="bodySmall" color={colors.textSecondary}>Service</Text>
            <Text variant="body">{serviceName}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text variant="body">{"Main-d'œuvre (FCFA) *"}</Text>
          <TextInput
            style={styles.input}
            value={laborCost}
            onChangeText={setLaborCost}
            placeholder="15000"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            accessibilityLabel="Coût main-d'œuvre"
          />
        </View>

        <View style={styles.section}>
          <Text variant="body">Matériel (FCFA)</Text>
          <TextInput
            style={styles.input}
            value={materialCost}
            onChangeText={setMaterialCost}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            accessibilityLabel="Coût matériel"
          />
        </View>

        <View style={styles.section}>
          <Text variant="body">Déplacement (FCFA)</Text>
          <TextInput
            style={styles.input}
            value={transportCost}
            onChangeText={setTransportCost}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            accessibilityLabel="Coût déplacement"
          />
        </View>

        <View style={styles.totalCard}>
          <Text variant="bodySmall" color={colors.textSecondary}>Total estimé</Text>
          <Text variant="h2" color={colors.primary}>{formatCurrency(total)}</Text>
          <Text variant="bodySmall" color={colors.textTertiary}>
            Le montant final sera confirmé par le serveur.
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="body">Délai estimé</Text>
          <TextInput
            style={styles.input}
            value={estimatedDuration}
            onChangeText={setEstimatedDuration}
            placeholder="Ex: 2 heures, 1 journée..."
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Délai estimé"
          />
        </View>

        <View style={styles.section}>
          <Text variant="body">Validité (jours)</Text>
          <TextInput
            style={styles.input}
            value={validDays}
            onChangeText={setValidDays}
            placeholder="7"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            accessibilityLabel="Validité en jours"
          />
        </View>

        <View style={styles.section}>
          <Text variant="body">Notes / Description</Text>
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
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={createQuote.isPending ? 'Envoi...' : 'Envoyer le devis'}
          onPress={handleSubmit}
          disabled={!canSubmit || createQuote.isPending}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxxl },
  serviceInfo: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  section: { gap: spacing.sm },
  input: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 16, color: colors.text },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  totalCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', gap: spacing.xs },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
});
