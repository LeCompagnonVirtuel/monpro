import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useProfessionalRequests } from '@/hooks/use-professional-requests';
import { ServiceRequest } from '@/api/requests';
import { formatRelativeDate } from '@/lib/format';

const URGENCY_CONFIG: Record<string, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  LOW: { color: colors.textTertiary, label: 'Basse', icon: 'arrow-down-outline' },
  NORMAL: { color: colors.info, label: 'Normale', icon: 'remove-outline' },
  HIGH: { color: colors.warning, label: 'Haute', icon: 'arrow-up-outline' },
  URGENT: { color: colors.error, label: 'Urgente', icon: 'alert-circle-outline' },
};

const STATUS_LABELS: Record<string, { color: string; label: string }> = {
  DRAFT: { color: colors.textTertiary, label: 'Brouillon' },
  SUBMITTED: { color: colors.info, label: 'Soumise' },
  MATCHING: { color: colors.info, label: 'Recherche' },
  QUOTED: { color: colors.warning, label: 'Devis envoyés' },
  ACCEPTED: { color: colors.success, label: 'Acceptée' },
  SCHEDULED: { color: colors.primary, label: 'Planifiée' },
  IN_PROGRESS: { color: colors.primary, label: 'En cours' },
  COMPLETED: { color: colors.success, label: 'Terminée' },
  CANCELLED: { color: colors.error, label: 'Annulée' },
  DISPUTED: { color: colors.error, label: 'Litige' },
};

export default function ProfessionalRequestsScreen() {
  const { data, isLoading, error, refetch } = useProfessionalRequests({ limit: 30 });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Demandes</Text>
        </View>
        <View style={styles.loadingContent}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} width="100%" height={100} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Demandes</Text>
        </View>
        <ErrorState message="Impossible de charger les demandes" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const requests = data?.requests || [];

  if (requests.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Demandes</Text>
        </View>
        <EmptyState title="Aucune nouvelle demande" description="Les demandes correspondant à vos services apparaîtront ici." icon="document-text-outline" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h2">Demandes</Text>
        <Text variant="bodySmall" color={colors.textSecondary}>{data?.total || 0} disponible(s)</Text>
      </View>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RequestCard request={item} />}
        contentContainerStyle={styles.listContent}
        onRefresh={refetch}
        refreshing={false}
      />
    </SafeAreaView>
  );
}

function RequestCard({ request }: { request: ServiceRequest }) {
  const urgency = URGENCY_CONFIG[request.urgency] || URGENCY_CONFIG.NORMAL;
  const status = STATUS_LABELS[request.status];

  const handleQuote = () => {
    router.push({
      pathname: '/(professional)/create-quote',
      params: { requestId: request.id, serviceName: request.service?.name || '' },
    } as never);
  };

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/(professional)/request-detail', params: { id: request.id } } as never)}
      accessibilityLabel={`Demande : ${request.title}`}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.cardTitle}>{request.title}</Text>
          <View style={[styles.urgencyBadge, { backgroundColor: urgency.color + '15' }]}>
            <Ionicons name={urgency.icon} size={12} color={urgency.color} />
            <Text variant="caption" color={urgency.color}>{urgency.label}</Text>
          </View>
        </View>
        <Text variant="caption" color={colors.textSecondary}>{request.service?.name}</Text>
      </View>

      {request.description && (
        <Text variant="caption" color={colors.textTertiary} numberOfLines={2} style={styles.cardDescription}>
          {request.description}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
          <Text variant="caption" color={colors.textTertiary}>{formatRelativeDate(request.createdAt)}</Text>
        </View>
        {status && (
          <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
            <Text variant="caption" color={status.color}>{status.label}</Text>
          </View>
        )}
      </View>

      <Pressable
        style={styles.quoteBtn}
        onPress={handleQuote}
        accessibilityLabel="Créer un devis"
        accessibilityRole="button"
      >
        <Ionicons name="create-outline" size={16} color={colors.textInverse} />
        <Text variant="buttonSmall" color={colors.textInverse}>Créer un devis</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.xs },
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadows.sm },
  cardHeader: { gap: spacing.xs },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { flex: 1 },
  urgencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  cardDescription: { lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  quoteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.secondary, paddingVertical: spacing.md, borderRadius: radius.md },
});
