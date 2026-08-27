import { useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Card, Badge, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useServiceRequests } from '@/hooks/use-service-requests';
import { ServiceRequest, ServiceRequestStatus } from '@/api/requests';
import { formatDate } from '@/lib/format';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

const FILTER_MAP: Record<FilterTab, ServiceRequestStatus | undefined> = {
  all: undefined,
  active: 'SUBMITTED',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
};

const STATUS_LABELS: Partial<Record<ServiceRequestStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'error' }>> = {
  DRAFT: { label: 'Brouillon', variant: 'info' },
  SUBMITTED: { label: 'Envoyée', variant: 'info' },
  MATCHING: { label: 'En cours', variant: 'warning' },
  QUOTED: { label: 'Devis reçu', variant: 'info' },
  ACCEPTED: { label: 'Acceptée', variant: 'success' },
  SCHEDULED: { label: 'Planifiée', variant: 'info' },
  IN_PROGRESS: { label: 'En cours', variant: 'warning' },
  COMPLETED: { label: 'Terminée', variant: 'success' },
  CANCELLED: { label: 'Annulée', variant: 'error' },
  DISPUTED: { label: 'Litige', variant: 'error' },
};

export default function RequestsScreen() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const { data, isLoading, error, refetch, isRefetching } = useServiceRequests(
    FILTER_MAP[filter] ? { status: FILTER_MAP[filter] } : undefined,
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h2">Mes demandes</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push('/(client)/create-request')}
          accessibilityLabel="Nouvelle demande"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color={colors.textInverse} />
        </Pressable>
      </View>

      <View style={styles.filters}>
        {(['all', 'active', 'completed', 'cancelled'] as FilterTab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === tab }}
          >
            <Text variant="caption" color={filter === tab ? colors.primary : colors.textSecondary}>
              {tab === 'all' ? 'Toutes' : tab === 'active' ? 'En cours' : tab === 'completed' ? 'Terminées' : 'Annulées'}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={90} />
          ))}
        </View>
      ) : error ? (
        <ErrorState message="Impossible de charger vos demandes" onRetry={refetch} />
      ) : !data?.requests.length ? (
        <EmptyState
          title="Aucune demande"
          description={"Vous n'avez pas encore créé de demande de service."}
        />
      ) : (
        <FlatList
          data={data.requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <RequestCard request={item} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
}

function RequestCard({ request }: { request: ServiceRequest }) {
  const statusInfo = STATUS_LABELS[request.status];

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(client)/request-detail', params: { id: request.id } })}
      accessibilityLabel={request.title}
    >
      <Card style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <Text variant="body" numberOfLines={1} style={styles.requestTitle}>{request.title}</Text>
          {statusInfo && <Badge label={statusInfo.label} variant={statusInfo.variant} />}
        </View>
        {request.service && (
          <Text variant="caption" color={colors.textSecondary}>{request.service.name}</Text>
        )}
        <View style={styles.requestMeta}>
          <Text variant="caption" color={colors.textTertiary}>{formatDate(request.createdAt)}</Text>
          {request.urgency === 'URGENT' && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={12} color={colors.error} />
              <Text variant="caption" color={colors.error}>Urgent</Text>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  filterTabActive: {
    backgroundColor: '#E8F5ED',
  },
  loadingList: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  requestCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestTitle: {
    flex: 1,
    marginRight: spacing.sm,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
});
