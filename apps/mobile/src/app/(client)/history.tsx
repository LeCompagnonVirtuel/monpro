import { useState, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useServiceRequests } from '@/hooks/use-service-requests';
import { formatCurrency, formatDate } from '@/lib/format';
import { ServiceRequestStatus } from '@/api/requests';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  COMPLETED: { color: colors.success, label: 'Terminé' },
  CANCELLED: { color: colors.error, label: 'Annulé' },
  IN_PROGRESS: { color: colors.primary, label: 'En cours' },
  SCHEDULED: { color: colors.info, label: 'Planifié' },
  ACCEPTED: { color: colors.success, label: 'Accepté' },
  PENDING: { color: colors.warning, label: 'En attente' },
  SUBMITTED: { color: colors.warning, label: 'Envoyé' },
  MATCHING: { color: colors.warning, label: 'Recherche' },
  QUOTED: { color: colors.info, label: 'Devis reçu' },
  DISPUTED: { color: colors.error, label: 'Litige' },
  DRAFT: { color: colors.textTertiary, label: 'Brouillon' },
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: requestsData, isLoading, error, refetch } = useServiceRequests({ limit: 50 });

  const requests = requestsData?.requests || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleRequestPress = (requestId: string) => {
    router.push({ pathname: '/(client)/request-detail', params: { requestId } });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Retour" accessibilityRole="button">
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text variant="h3" style={styles.headerTitle}>Historique</Text>
            <View style={styles.backBtn} />
          </View>
        </View>
        <View style={styles.loadingContent}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width={40} height={40} borderRadius={radius.md} />
              <View style={styles.skeletonText}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Retour" accessibilityRole="button">
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text variant="h3" style={styles.headerTitle}>Historique</Text>
            <View style={styles.backBtn} />
          </View>
        </View>
        <ErrorState message="Impossible de charger l'historique" onRetry={onRefresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Retour" accessibilityRole="button">
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text variant="h3" style={styles.headerTitle}>Historique</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {requests.length === 0 ? (
          <EmptyState
            title="Aucun historique"
            description="Vos demandes de service apparaîtront ici."
            icon="time-outline"
          />
        ) : (
          <View style={styles.historyList}>
            {requests.map((req) => {
              const statusCfg = STATUS_CONFIG[req.status] || { color: colors.textTertiary, label: req.status };
              return (
                <Pressable
                  key={req.id}
                  style={styles.historyCard}
                  onPress={() => handleRequestPress(req.id)}
                  accessibilityLabel={`${req.title}, ${statusCfg.label}`}
                  accessibilityRole="button"
                >
                  <View style={styles.cardLeft}>
                    <View style={[styles.typeIcon, { backgroundColor: statusCfg.color + '15' }]}>
                      <Ionicons name="document-text-outline" size={18} color={statusCfg.color} />
                    </View>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text variant="bodyMedium" numberOfLines={1}>{req.title}</Text>
                    <Text variant="caption" color={colors.textSecondary}>{formatDate(req.createdAt)}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '12' }]}>
                      <Text variant="caption" color={statusCfg.color}>{statusCfg.label}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

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
  loadingContent: { padding: spacing.xl, gap: spacing.md },
  skeletonCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  skeletonText: { flex: 1, gap: spacing.xs },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  historyList: { gap: spacing.sm },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  cardLeft: {},
  typeIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 2 },
  cardRight: { alignItems: 'flex-end', gap: spacing.xxs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.sm },
  bottomSpacer: { height: spacing.xxxl },
});
