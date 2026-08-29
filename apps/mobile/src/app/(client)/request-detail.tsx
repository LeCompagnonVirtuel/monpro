import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Badge, Skeleton, Divider, Button } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useServiceRequest } from '@/hooks/use-service-requests';
import { useQuotesForRequest } from '@/hooks/use-quotes';
import { ServiceRequestStatus } from '@/api/requests';
import { formatDate, formatCurrency } from '@/lib/format';

const STATUS_LABELS: Record<ServiceRequestStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'error' }> = {
  DRAFT: { label: 'Brouillon', variant: 'info' },
  SUBMITTED: { label: 'Envoyée', variant: 'info' },
  MATCHING: { label: 'Matching en cours', variant: 'warning' },
  QUOTED: { label: 'Devis reçu', variant: 'info' },
  ACCEPTED: { label: 'Acceptée', variant: 'success' },
  SCHEDULED: { label: 'Planifiée', variant: 'info' },
  IN_PROGRESS: { label: 'En cours', variant: 'warning' },
  COMPLETED: { label: 'Terminée', variant: 'success' },
  CANCELLED: { label: 'Annulée', variant: 'error' },
  DISPUTED: { label: 'Litige', variant: 'error' },
};

const URGENCY_LABELS: Record<string, string> = {
  LOW: 'Faible',
  NORMAL: 'Normale',
  HIGH: 'Élevée',
  URGENT: 'Urgente',
};

const STATUS_ORDER: ServiceRequestStatus[] = [
  'SUBMITTED', 'MATCHING', 'QUOTED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED',
];

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: request, isLoading, error, refetch } = useServiceRequest(id);
  const { data: quotes } = useQuotesForRequest(id);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.loadingContent}>
          <Skeleton width="80%" height={28} />
          <Skeleton width="100%" height={100} />
          <Skeleton width="100%" height={60} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <ErrorState message="Demande introuvable" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const statusInfo = STATUS_LABELS[request.status];
  const pendingQuotes = quotes?.filter((q) => q.status === 'PENDING') ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="h3" numberOfLines={1} style={styles.headerTitle}>Détail</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <View style={{ flex: 1 }}>
            <Text variant="h2">{request.title}</Text>
          </View>
          <Badge label={statusInfo.label} variant={statusInfo.variant} />
        </View>

        <StatusTimeline currentStatus={request.status} />

        <Divider />

        <View style={styles.detailSection}>
          <DetailRow icon="construct-outline" label="Service" value={request.service?.name || '-'} />
          <DetailRow icon="alert-circle-outline" label="Urgence" value={URGENCY_LABELS[request.urgency] || request.urgency} />
          <DetailRow icon="calendar-outline" label="Créée le" value={formatDate(request.createdAt)} />
          {request.preferredDate && (
            <DetailRow icon="time-outline" label="Date souhaitée" value={request.preferredDate} />
          )}
          {request.preferredTimeStart && (
            <DetailRow icon="time-outline" label="Horaire" value={`${request.preferredTimeStart} - ${request.preferredTimeEnd || ''}`} />
          )}
        </View>

        <Divider />

        <View style={styles.descriptionSection}>
          <Text variant="h3">Description</Text>
          <Text variant="body" color={colors.textSecondary}>{request.description}</Text>
        </View>

        {quotes && quotes.length > 0 && (
          <>
            <Divider />
            <View style={styles.quotesSection}>
              <View style={styles.quotesSectionHeader}>
                <Text variant="h3">Devis reçus ({quotes.length})</Text>
                {quotes.length > 1 && (
                  <Pressable
                    onPress={() => router.push({ pathname: '/(client)/quotes', params: { requestId: id } })}
                    accessibilityLabel="Voir tous les devis"
                  >
                    <Text variant="bodySmall" color={colors.primary}>Comparer</Text>
                  </Pressable>
                )}
              </View>

              {quotes.slice(0, 3).map((quote) => (
                <Pressable
                  key={quote.id}
                  style={styles.quoteCard}
                  onPress={() => router.push({ pathname: '/(client)/quote-detail', params: { quoteId: quote.id, requestId: id } })}
                  accessibilityLabel={`Devis de ${quote.professional?.businessName || quote.professional?.user?.fullName}`}
                >
                  <View style={styles.quoteCardHeader}>
                    <Text variant="body" numberOfLines={1}>
                      {quote.professional?.businessName || quote.professional?.user?.fullName || 'Professionnel'}
                    </Text>
                    {quote.professional?.isVerified && (
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    )}
                  </View>
                  <View style={styles.quoteCardBody}>
                    <Text variant="h3" color={colors.primary}>{formatCurrency(quote.totalAmount)}</Text>
                    <Badge
                      label={quote.status === 'PENDING' ? 'En attente' : quote.status === 'ACCEPTED' ? 'Accepté' : quote.status === 'REJECTED' ? 'Refusé' : 'Expiré'}
                      variant={quote.status === 'ACCEPTED' ? 'success' : quote.status === 'REJECTED' ? 'error' : 'info'}
                    />
                  </View>
                  {quote.estimatedDuration && (
                    <Text variant="bodySmall" color={colors.textSecondary}>
                      Délai : {quote.estimatedDuration}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </>
        )}

        {pendingQuotes.length > 0 && (
          <View style={styles.actionsSection}>
            <Button
              title={`Voir les ${pendingQuotes.length} devis`}
              onPress={() => router.push({ pathname: '/(client)/quotes', params: { requestId: id } })}
              size="lg"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusTimeline({ currentStatus }: { currentStatus: ServiceRequestStatus }) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  if (currentIndex === -1 && currentStatus !== 'CANCELLED' && currentStatus !== 'DISPUTED') return null;

  return (
    <View style={styles.timeline}>
      {STATUS_ORDER.map((status, index) => {
        const isDone = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <View key={status} style={styles.timelineItem}>
            <View style={[styles.timelineDot, isDone && styles.timelineDotDone, isCurrent && styles.timelineDotCurrent]} />
            {index < STATUS_ORDER.length - 1 && (
              <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text variant="bodySmall" color={colors.textSecondary} style={styles.detailLabel}>{label}</Text>
      <Text variant="bodySmall" style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.xl, gap: spacing.lg },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: spacing.lg, gap: spacing.md },
  detailSection: { paddingVertical: spacing.lg, gap: spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailLabel: { width: 110 },
  detailValue: { flex: 1 },
  descriptionSection: { paddingVertical: spacing.lg, gap: spacing.md },
  timeline: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  timelineItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  timelineDotDone: { backgroundColor: colors.success },
  timelineDotCurrent: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surface },
  timelineLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 2 },
  timelineLineDone: { backgroundColor: colors.success },
  quotesSection: { paddingVertical: spacing.lg, gap: spacing.md },
  quotesSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quoteCard: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  quoteCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  quoteCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionsSection: { paddingVertical: spacing.lg },
});
