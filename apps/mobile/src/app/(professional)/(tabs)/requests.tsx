import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useProfessionalRequests } from '@/hooks/use-professional-requests';
import { ServiceRequest } from '@/api/requests';
import { formatRelativeDate } from '@/lib/format';

const URGENCY_COLORS: Record<string, string> = {
  LOW: colors.textTertiary,
  NORMAL: colors.info,
  HIGH: colors.warning,
  URGENT: colors.error,
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
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} width="100%" height={80} />)}
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
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/(professional)/request-detail', params: { id: request.id } } as never)}
      accessibilityLabel={`Demande: ${request.title}`}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text variant="body" numberOfLines={1}>{request.title}</Text>
          <Text variant="bodySmall" color={colors.textSecondary}>{request.service?.name}</Text>
        </View>
        <View style={[styles.urgencyDot, { backgroundColor: URGENCY_COLORS[request.urgency] || colors.info }]} />
      </View>
      <View style={styles.cardBottom}>
        <Text variant="bodySmall" color={colors.textTertiary}>{formatRelativeDate(request.createdAt)}</Text>
        <View style={styles.statusBadge}>
          <Text variant="bodySmall" color={colors.primary}>{request.status}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.xs },
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardInfo: { flex: 1, gap: 2 },
  urgencyDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
});
