import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text } from '@/components/ui';

// ─── STATUS CONFIG ───

export type RequestStatus = 'DRAFT' | 'SUBMITTED' | 'MATCHING' | 'QUOTED' | 'ACCEPTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ARRIVING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export const REQUEST_STATUS_CONFIG: Record<RequestStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: colors.textTertiary },
  SUBMITTED: { label: 'Envoyée', color: colors.info },
  MATCHING: { label: 'Recherche', color: colors.warning },
  QUOTED: { label: 'Devis reçus', color: colors.info },
  ACCEPTED: { label: 'Acceptée', color: colors.success },
  SCHEDULED: { label: 'Planifiée', color: colors.primary },
  IN_PROGRESS: { label: 'En cours', color: colors.warning },
  COMPLETED: { label: 'Terminée', color: colors.success },
  CANCELLED: { label: 'Annulée', color: colors.error },
  DISPUTED: { label: 'Litige', color: colors.error },
};

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: colors.warning },
  CONFIRMED: { label: 'Confirmée', color: colors.info },
  ARRIVING: { label: 'En route', color: colors.warning },
  IN_PROGRESS: { label: 'En cours', color: colors.primary },
  COMPLETED: { label: 'Terminée', color: colors.success },
  CANCELLED: { label: 'Annulée', color: colors.error },
  DISPUTED: { label: 'Litige', color: colors.error },
};

export const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  LOW: { label: 'Basse', color: colors.textTertiary, icon: 'arrow-down-outline' },
  NORMAL: { label: 'Normale', color: colors.info, icon: 'remove-outline' },
  HIGH: { label: 'Haute', color: colors.warning, icon: 'arrow-up-outline' },
  URGENT: { label: 'Urgente', color: colors.error, icon: 'alert-circle-outline' },
};

// ─── COMPONENTS ───

interface StatusBadgeProps {
  status: RequestStatus | BookingStatus;
  variant?: 'default' | 'outlined';
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const config = REQUEST_STATUS_CONFIG[status as RequestStatus] || BOOKING_STATUS_CONFIG[status as BookingStatus];
  if (!config) return null;

  return (
    <View style={[
      styles.badge,
      { backgroundColor: variant === 'default' ? config.color + '18' : 'transparent' },
      variant === 'outlined' && { borderWidth: 1, borderColor: config.color },
    ]}>
      <Text variant="caption" color={config.color} style={styles.badgeText}>
        {config.label}
      </Text>
    </View>
  );
}

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  showIcon?: boolean;
}

export function UrgencyBadge({ urgency, showIcon = false }: UrgencyBadgeProps) {
  const config = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.NORMAL;

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '18' }]}>
      {showIcon && <Ionicons name={config.icon} size={12} color={config.color} />}
      <Text variant="caption" color={config.color} style={styles.badgeText}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
