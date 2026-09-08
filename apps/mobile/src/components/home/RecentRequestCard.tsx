import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { ServiceRequest, ServiceRequestStatus } from '@/api/requests';
import { formatRelativeDate } from '@/lib/format';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  SUBMITTED: { color: colors.info, bg: colors.infoLight, label: 'Envoyée' },
  MATCHING: { color: colors.warning, bg: colors.warningLight, label: 'Recherche' },
  QUOTED: { color: colors.primary, bg: colors.surfaceSecondary, label: 'Devis reçus' },
  ACCEPTED: { color: colors.success, bg: colors.successLight, label: 'Acceptée' },
  SCHEDULED: { color: colors.info, bg: colors.infoLight, label: 'Planifiée' },
  IN_PROGRESS: { color: colors.primary, bg: colors.secondaryMuted, label: 'En cours' },
  COMPLETED: { color: colors.success, bg: colors.successLight, label: 'Terminée' },
  CANCELLED: { color: colors.error, bg: colors.errorLight, label: 'Annulée' },
  DISPUTED: { color: colors.error, bg: colors.errorLight, label: 'Litige' },
  DRAFT: { color: colors.textTertiary, bg: colors.surfaceSecondary, label: 'Brouillon' },
};

interface RecentRequestCardProps {
  request: ServiceRequest;
}

export function RecentRequestCard({ request }: RecentRequestCardProps) {
  const config = STATUS_CONFIG[request.status] || STATUS_CONFIG.SUBMITTED;
  const locationLabel = request.address?.fullAddress || '';
  const serviceName = request.service?.name || '';

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/(client)/request-detail', params: { id: request.id } })}
      accessibilityLabel={`${request.title}, ${config.label}`}
      accessibilityRole="button"
    >
      <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
        <Ionicons name="document-text-outline" size={20} color={config.color} />
      </View>

      <View style={styles.content}>
        <Text variant="bodyMedium" numberOfLines={1} style={styles.title}>
          {request.title}
        </Text>

        <View style={styles.metaRow}>
          {locationLabel ? (
            <Text variant="caption" color={colors.textTertiary} numberOfLines={1}>
              {locationLabel}
            </Text>
          ) : null}
          {locationLabel && (
            <Text variant="caption" color={colors.textTertiary}> · </Text>
          )}
          <Text variant="caption" color={colors.textTertiary}>
            {formatRelativeDate(request.createdAt)}
          </Text>
        </View>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
        <Text variant="caption" color={config.color} style={styles.statusText}>
          {config.label}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
