import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

const PAYMENT_METHODS = [
  { id: 'orange', name: 'Orange Money', icon: 'phone-portrait-outline', color: '#FF6600', available: true },
  { id: 'mtn', name: 'MTN MoMo', icon: 'phone-portrait-outline', color: '#FFCC00', available: true },
  { id: 'wave', name: 'Wave', icon: 'water-outline', color: '#0066FF', available: true },
  { id: 'moov', name: 'Moov Money', icon: 'phone-portrait-outline', color: '#009933', available: false },
];

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Retour"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text variant="h3" style={styles.headerTitle}>Moyens de paiement</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text variant="body" color={colors.textSecondary} style={styles.description}>
          {"Choisissez votre moyen de paiement préféré pour vos transactions MONPRO."}
        </Text>

        <View style={styles.methodsList}>
          {PAYMENT_METHODS.map((method) => (
            <Pressable
              key={method.id}
              style={[styles.methodCard, !method.available && styles.methodCardDisabled]}
              onPress={() => method.available && {}}
              disabled={!method.available}
              accessibilityLabel={method.name}
              accessibilityRole="button"
            >
              <View style={[styles.methodIcon, { backgroundColor: method.color + '15' }]}>
                <Ionicons name={method.icon as any} size={24} color={method.color} />
              </View>
              <View style={styles.methodInfo}>
                <Text variant="bodyMedium" style={!method.available ? styles.disabledText : undefined}>
                  {method.name}
                </Text>
                {!method.available && (
                  <Text variant="caption" color={colors.textTertiary}>Bientôt disponible</Text>
                )}
              </View>
              {method.available ? (
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              ) : (
                <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.infoText}>
            {"Vos informations de paiement sont sécurisées et chiffrées. MONPRO ne stocke jamais vos données bancaires."}
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  description: { lineHeight: 22, marginBottom: spacing.lg },
  methodsList: { gap: spacing.sm },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  methodCardDisabled: { opacity: 0.5 },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: { flex: 1, gap: 2 },
  disabledText: { color: colors.textTertiary },
  infoCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  infoText: { flex: 1, lineHeight: 20 },
  bottomSpacer: { height: spacing.xxxl },
});
