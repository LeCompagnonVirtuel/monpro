import { StyleSheet, View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton, Button } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useProfessionalRequest } from '@/hooks/use-professional-requests';
import { getErrorMessage } from '@/lib/api-errors';
import { formatDate, formatRelativeDate } from '@/lib/format';
import { messages } from '@/constants/messages';

const URGENCY_CONFIG: Record<string, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  LOW: { color: colors.textTertiary, label: messages.urgency.low, icon: 'arrow-down-outline' },
  NORMAL: { color: colors.info, label: messages.urgency.normalF, icon: 'remove-outline' },
  HIGH: { color: colors.warning, label: messages.urgency.high, icon: 'arrow-up-outline' },
  URGENT: { color: colors.error, label: messages.urgency.urgentF, icon: 'alert-circle-outline' },
};

const STATUS_LABELS: Record<string, { color: string; label: string }> = {
  DRAFT: { color: colors.textTertiary, label: messages.status.draft },
  SUBMITTED: { color: colors.info, label: messages.status.submitted },
  MATCHING: { color: colors.info, label: messages.status.matching },
  QUOTED: { color: colors.warning, label: messages.status.quotesSent },
  ACCEPTED: { color: colors.success, label: messages.status.accepted },
  SCHEDULED: { color: colors.primary, label: messages.status.planned },
  IN_PROGRESS: { color: colors.primary, label: messages.status.inProgress },
  COMPLETED: { color: colors.success, label: messages.status.completed },
  CANCELLED: { color: colors.error, label: messages.status.cancelled },
  DISPUTED: { color: colors.error, label: messages.status.dispute },
};

export default function ProfessionalRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: request, isLoading, error, refetch, isRefetching } = useProfessionalRequest(id);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          <Skeleton width="80%" height={24} />
          <Skeleton width="100%" height={60} />
          <Skeleton width="100%" height={40} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message={getErrorMessage(error, messages.errors.loadRequest)} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const urgency = URGENCY_CONFIG[request.urgency] || URGENCY_CONFIG.NORMAL;
  const status = STATUS_LABELS[request.status];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}>
        {/* Title & Service */}
        <View style={styles.titleSection}>
          <Text variant="h2">{request.title}</Text>
          <View style={styles.serviceRow}>
            <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
            <Text variant="bodyMedium" color={colors.primary}>{request.service?.name || messages.requests.detailLabels.service}</Text>
          </View>
        </View>

        {/* Urgency & Status */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: urgency.color + '15' }]}>
            <Ionicons name={urgency.icon} size={14} color={urgency.color} />
            <Text variant="caption" color={urgency.color}>{urgency.label}</Text>
          </View>
          {status && (
            <View style={[styles.badge, { backgroundColor: status.color + '15' }]}>
              <Text variant="caption" color={status.color}>{status.label}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {request.description && (
          <View style={styles.section}>
            <Text variant="caption" color={colors.textSecondary}>{messages.requests.detailLabels.description}</Text>
            <Text variant="body">{request.description}</Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.detailsCard}>
          {request.preferredDate && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text variant="caption" color={colors.textSecondary}>{messages.requests.detailLabels.desiredDate}</Text>
                <Text variant="bodyMedium">{formatDate(request.preferredDate)}</Text>
              </View>
            </View>
          )}

          {request.preferredTimeStart && request.preferredTimeEnd && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text variant="caption" color={colors.textSecondary}>{messages.requests.detailLabels.schedule}</Text>
                <Text variant="bodyMedium">{request.preferredTimeStart} — {request.preferredTimeEnd}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.detailInfo}>
              <Text variant="caption" color={colors.textSecondary}>{messages.requests.detailLabels.created}</Text>
              <Text variant="bodyMedium">{formatRelativeDate(request.createdAt)}</Text>
            </View>
          </View>

          {request.address?.fullAddress && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text variant="caption" color={colors.textSecondary}>{messages.requests.detailLabels.address}</Text>
                <Text variant="bodyMedium">{request.address.fullAddress}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={messages.professionalRequests.viewAndRespond}
          onPress={() => router.push({ pathname: '/(professional)/create-quote', params: { requestId: request.id, serviceName: request.service?.name || '' } })}
        />
      </View>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel={messages.common.back} accessibilityRole="button" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>{messages.requests.title}</Text>
      <View style={styles.backBtn} />
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
  titleSection: { gap: spacing.sm },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  section: { gap: spacing.sm },
  detailsCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadows.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  detailIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  detailInfo: { flex: 1, gap: 2 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
});
