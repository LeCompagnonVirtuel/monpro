import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { ServiceRequest } from '@/api/requests';
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

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/(client)/request-detail', params: { id: request.id } })}
      accessibilityLabel={`${request.title}, ${config.label}`}
      accessibilityRole="button"
    >
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Ionicons name="document-text-outline" size={18} color={config.color} />
      </View>

      <View style={styles.body}>
        <Text variant="bodyMedium" numberOfLines={1} style={styles.title}>
          {request.title}
        </Text>
        <View style={styles.meta}>
          {locationLabel ? (
            <Text variant="caption" color={colors.textTertiary} numberOfLines={1} style={styles.metaText}>
              {locationLabel}
            </Text>
          ) : null}
          {locationLabel ? <Text variant="caption" color={colors.textTertiary}> · </Text> : null}
          <Text variant="caption" color={colors.textTertiary} style={styles.metaText}>
            {formatRelativeDate(request.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.end}>
        <View style={[styles.pill, { backgroundColor: config.bg }]}>
          <Text variant="caption" color={config.color} style={styles.pillText}>
            {config.label}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    flexShrink: 1,
  },
  end: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
