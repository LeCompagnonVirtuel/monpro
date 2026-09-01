import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { SectionHeader } from '@/components/home/SectionHeader';

interface ProfileStatsProps {
  requestCount: number;
  completedCount: number;
  messageCount: number;
  averageRating: number | null;
  reviewCount: number;
}

export function ProfileStats({
  requestCount,
  completedCount,
  messageCount,
  averageRating,
  reviewCount,
}: ProfileStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <SectionHeader title="Mon activité" />

        <View style={styles.grid}>
          <StatItem
            icon="briefcase-outline"
            iconBg={colors.surfaceSecondary}
            iconColor={colors.primary}
            value={requestCount.toString()}
            label="Demandes envoyées"
          />
          <StatItem
            icon="checkmark-circle-outline"
            iconBg={colors.successLight}
            iconColor={colors.success}
            value={completedCount.toString()}
            label="Projets terminés"
          />
          <StatItem
            icon="chatbubble-outline"
            iconBg={colors.infoLight}
            iconColor={colors.info}
            value={messageCount.toString()}
            label="Messages échangés"
          />
          <StatItem
            icon="star-outline"
            iconBg={colors.warningLight}
            iconColor={colors.warning}
            value={averageRating != null ? averageRating.toFixed(1) : '-'}
            label="Note moyenne"
            sublabel={reviewCount > 0 ? `(${reviewCount} avis)` : undefined}
            showStar={averageRating != null}
          />
        </View>
      </View>
    </View>
  );
}

interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  sublabel?: string;
  showStar?: boolean;
}

function StatItem({ icon, iconBg, iconColor, value, label, sublabel, showStar }: StatItemProps) {
  return (
    <View style={styles.stat}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text variant="h3" style={styles.statValue}>{value}</Text>
      <Text variant="caption" color={colors.textSecondary} align="center" style={styles.statLabel}>
        {label}
      </Text>
      {sublabel && (
        <View style={styles.sublabelRow}>
          {showStar && <Ionicons name="star" size={10} color={colors.secondary} />}
          <Text variant="caption" color={colors.textTertiary} style={styles.sublabelText}>
            {sublabel}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.sm,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {},
  statLabel: {},
  sublabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  sublabelText: {},
});
