import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Badge, Skeleton, Avatar } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useQuotesForRequest } from '@/hooks/use-quotes';
import { Quote } from '@/api/quotes';
import { formatCurrency, formatDate } from '@/lib/format';

export default function QuotesScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { data: quotes, isLoading, error, refetch } = useQuotesForRequest(requestId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={120} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message="Impossible de charger les devis" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <EmptyState title="Vous n'avez pas encore reçu de devis." icon="document-text-outline" />
      </SafeAreaView>
    );
  }

  const sorted = [...quotes].sort((a, b) => a.totalAmount - b.totalAmount);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <QuoteCard quote={item} rank={index + 1} requestId={requestId} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Comparer les devis</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

function QuoteCard({ quote, rank, requestId }: { quote: Quote; rank: number; requestId: string }) {
  const proName = quote.professional?.businessName || quote.professional?.user?.fullName || 'Professionnel';

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/(client)/quote-detail', params: { quoteId: quote.id, requestId } })}
      accessibilityLabel={`Devis ${rank} de ${proName}, ${formatCurrency(quote.totalAmount)}`}
    >
      <View style={styles.cardHeader}>
        <Avatar
          uri={quote.professional?.user?.avatarUrl}
          name={proName}
          size={44}
        />
        <View style={styles.cardHeaderInfo}>
          <View style={styles.cardHeaderNameRow}>
            <Text variant="body" numberOfLines={1}>{proName}</Text>
            {quote.professional?.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            )}
          </View>
          {quote.professional?.averageRating != null && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.secondary} />
              <Text variant="bodySmall" color={colors.textSecondary}>
                {quote.professional.averageRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
        <Text variant="h2" color={colors.primary}>{formatCurrency(quote.totalAmount)}</Text>
      </View>

      <View style={styles.cardDetails}>
        <DetailChip icon="hammer-outline" label={`Main-d'œuvre: ${formatCurrency(quote.laborCost)}`} />
        {quote.materialCost != null && quote.materialCost > 0 && (
          <DetailChip icon="cube-outline" label={`Matériel: ${formatCurrency(quote.materialCost)}`} />
        )}
        {quote.transportCost != null && quote.transportCost > 0 && (
          <DetailChip icon="car-outline" label={`Déplacement: ${formatCurrency(quote.transportCost)}`} />
        )}
        {quote.estimatedDuration && (
          <DetailChip icon="time-outline" label={`Délai: ${quote.estimatedDuration}`} />
        )}
      </View>

      <View style={styles.cardFooter}>
        <Badge
          label={quote.status === 'PENDING' ? 'En attente' : quote.status === 'ACCEPTED' ? 'Accepté' : quote.status === 'REJECTED' ? 'Refusé' : 'Expiré'}
          variant={quote.status === 'ACCEPTED' ? 'success' : quote.status === 'REJECTED' ? 'error' : 'info'}
        />
        <Text variant="bodySmall" color={colors.textTertiary}>{formatDate(quote.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

function DetailChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <Text variant="bodySmall" color={colors.textSecondary}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  listContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardHeaderInfo: { flex: 1, gap: 2 },
  cardHeaderNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.surfaceSecondary, borderRadius: radius.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
