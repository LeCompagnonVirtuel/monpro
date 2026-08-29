import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useQuotesForRequest } from '@/hooks/use-quotes';
import { formatCurrency, formatDate } from '@/lib/format';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: colors.warning, label: 'En attente' },
  ACCEPTED: { color: colors.success, label: 'Accepté' },
  REJECTED: { color: colors.error, label: 'Refusé' },
  EXPIRED: { color: colors.textTertiary, label: 'Expiré' },
};

export default function QuoteDetailScreen() {
  const { quoteId, requestId } = useLocalSearchParams<{ quoteId: string; requestId: string }>();
  const { data: quotes, isLoading, error, refetch } = useQuotesForRequest(requestId);
  const quote = quotes?.find((q) => q.id === quoteId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          <Skeleton width="80%" height={24} />
          <Skeleton width="100%" height={100} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !quote) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message="Impossible de charger le devis" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.PENDING;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
            <Text variant="body" color={statusConfig.color}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={styles.amountCard}>
          <Text variant="h2" color={colors.primary}>{formatCurrency(quote.totalAmount)}</Text>
          <Text variant="bodySmall" color={colors.textTertiary}>Montant total</Text>
        </View>

        <View style={styles.breakdown}>
          <BreakdownRow label="Main-d'œuvre" amount={quote.laborCost} />
          {quote.materialCost ? <BreakdownRow label="Matériel" amount={quote.materialCost} /> : null}
          {quote.transportCost ? <BreakdownRow label="Déplacement" amount={quote.transportCost} /> : null}
        </View>

        {quote.description && (
          <View style={styles.section}>
            <Text variant="bodySmall" color={colors.textSecondary}>Description</Text>
            <Text variant="body">{quote.description}</Text>
          </View>
        )}

        {quote.estimatedDuration && (
          <View style={styles.section}>
            <Text variant="bodySmall" color={colors.textSecondary}>Délai estimé</Text>
            <Text variant="body">{quote.estimatedDuration}</Text>
          </View>
        )}

        {quote.validUntil && (
          <View style={styles.section}>
            <Text variant="bodySmall" color={colors.textSecondary}>Valide jusqu{"'"}au</Text>
            <Text variant="body">{formatDate(quote.validUntil)}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text variant="bodySmall" color={colors.textSecondary}>Créé le</Text>
          <Text variant="body">{formatDate(quote.createdAt)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Détail devis</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

function BreakdownRow({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={styles.breakdownRow}>
      <Text variant="body" color={colors.textSecondary}>{label}</Text>
      <Text variant="body">{formatCurrency(amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  content: { padding: spacing.lg, gap: spacing.lg },
  statusSection: { alignItems: 'center' },
  statusBadge: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full },
  amountCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  breakdown: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { gap: spacing.xs },
});
