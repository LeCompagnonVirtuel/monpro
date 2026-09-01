import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useQuotesForRequest } from '@/hooks/use-quotes';
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/format';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }> = {
  PENDING: { color: colors.warning, label: 'En attente', icon: 'hourglass-outline', description: 'Le client examine votre devis.' },
  ACCEPTED: { color: colors.success, label: 'Accepté', icon: 'checkmark-circle-outline', description: 'Le client a accepté votre devis.' },
  REJECTED: { color: colors.error, label: 'Refusé', icon: 'close-circle-outline', description: 'Le client a refusé votre devis.' },
  EXPIRED: { color: colors.textTertiary, label: 'Expiré', icon: 'time-outline', description: 'Ce devis a expiré.' },
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
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusConfig.color + '10' }]}>
          <Ionicons name={statusConfig.icon} size={24} color={statusConfig.color} />
          <View style={styles.statusText}>
            <Text variant="bodyMedium" color={statusConfig.color}>{statusConfig.label}</Text>
            <Text variant="caption" color={colors.textSecondary}>{statusConfig.description}</Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountCard}>
          <Text variant="caption" color={colors.textSecondary}>MONTANT TOTAL</Text>
          <Text variant="h1" color={colors.primary}>{formatCurrency(quote.totalAmount)}</Text>
        </View>

        {/* Breakdown */}
        <View style={styles.breakdownCard}>
          <Text variant="caption" color={colors.textSecondary}>DÉCOMPOSITION</Text>
          <View style={styles.breakdown}>
            <BreakdownRow label="Main-d'œuvre" amount={quote.laborCost} />
            {quote.materialCost ? <BreakdownRow label="Matériel" amount={quote.materialCost} /> : null}
            {quote.transportCost ? <BreakdownRow label="Déplacement" amount={quote.transportCost} /> : null}
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          {quote.description && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <View style={styles.detailInfo}>
                <Text variant="caption" color={colors.textSecondary}>Description</Text>
                <Text variant="body">{quote.description}</Text>
              </View>
            </View>
          )}

          {quote.estimatedDuration && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <View style={styles.detailInfo}>
                <Text variant="caption" color={colors.textSecondary}>Délai estimé</Text>
                <Text variant="body">{quote.estimatedDuration}</Text>
              </View>
            </View>
          )}

          {quote.validUntil && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <View style={styles.detailInfo}>
                <Text variant="caption" color={colors.textSecondary}>Valide jusqu{"'"}au</Text>
                <Text variant="body">{formatDate(quote.validUntil)}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <View style={styles.detailInfo}>
              <Text variant="caption" color={colors.textSecondary}>Créé</Text>
              <Text variant="body">{formatRelativeDate(quote.createdAt)}</Text>
            </View>
          </View>
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
      <Text variant="h3" style={styles.headerTitle}>Devis</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

function BreakdownRow({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={styles.breakdownRow}>
      <Text variant="body" color={colors.textSecondary}>{label}</Text>
      <Text variant="bodyMedium">{formatCurrency(amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  content: { padding: spacing.lg, gap: spacing.lg },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md },
  statusText: { flex: 1, gap: 2 },
  amountCard: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  breakdownCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadows.sm },
  breakdown: { gap: spacing.sm },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailsCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadows.sm },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  detailInfo: { flex: 1, gap: 2 },
});
