import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

type IllustrationType = 'discover' | 'request' | 'quotes' | 'professional';

interface OnboardingIllustrationProps {
  type: IllustrationType;
}

function FloatingCard({
  children,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  style?: object;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(500).springify()}
      style={[styles.floatingCard, style]}
    >
      {children}
    </Animated.View>
  );
}

function DiscoverIllustration() {
  return (
    <View style={styles.illustrationContainer}>
      <View style={styles.circleBg} />
      <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.heroIconWrap}>
        <Ionicons name="search" size={48} color={colors.textInverse} />
      </Animated.View>
      <FloatingCard style={styles.cardTopRight} delay={400}>
        <View style={styles.cardRow}>
          <View style={styles.avatarSmall} />
          <View style={styles.cardTextGroup}>
            <View style={styles.textLineLong} />
            <View style={styles.textLineShort} />
          </View>
        </View>
        <View style={styles.cardBadges}>
          <View style={styles.badgeGold}>
            <Ionicons name="star" size={10} color={colors.primary} />
            <Text variant="caption" color={colors.primary} style={styles.badgeText}>4.9</Text>
          </View>
          <View style={styles.badgeGreen}>
            <Ionicons name="checkmark-circle" size={10} color={colors.success} />
            <Text variant="caption" color={colors.success} style={styles.badgeText}>Vérifié</Text>
          </View>
        </View>
      </FloatingCard>
      <FloatingCard style={styles.cardBottomLeft} delay={600}>
        <View style={styles.cardRow}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <View style={styles.textLineMedium} />
        </View>
      </FloatingCard>
    </View>
  );
}

function RequestIllustration() {
  return (
    <View style={styles.illustrationContainer}>
      <View style={styles.circleBg} />
      <View style={styles.flowContainer}>
        {[
          { icon: 'document-text' as const, label: 'Demande', delay: 300 },
          { icon: 'people' as const, label: 'Pros', delay: 500 },
          { icon: 'receipt' as const, label: 'Devis', delay: 700 },
          { icon: 'hammer' as const, label: 'Intervention', delay: 900 },
        ].map((step, i) => (
          <Animated.View
            key={step.label}
            entering={FadeInUp.delay(step.delay).duration(400).springify()}
            style={styles.flowStep}
          >
            <View style={styles.flowIconCircle}>
              <Ionicons name={step.icon} size={22} color={colors.textInverse} />
            </View>
            <Text variant="caption" color={colors.textSecondary} style={styles.flowLabel}>
              {step.label}
            </Text>
            {i < 3 && (
              <Animated.View
                entering={FadeInDown.delay(step.delay + 200).duration(300)}
                style={styles.flowArrow}
              >
                <Ionicons name="chevron-down" size={14} color={colors.secondary} />
              </Animated.View>
            )}
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function QuotesIllustration() {
  return (
    <View style={styles.illustrationContainer}>
      <View style={styles.circleBg} />
      <View style={styles.quotesStack}>
        <FloatingCard style={[styles.quoteCard, styles.quoteCardBack]} delay={300}>
          <View style={styles.quoteHeader}>
            <View style={styles.avatarSmall} />
            <View style={styles.cardTextGroup}>
              <View style={styles.textLineMedium} />
              <View style={styles.textLineShort} />
            </View>
          </View>
        </FloatingCard>
        <FloatingCard style={[styles.quoteCard, styles.quoteCardMid]} delay={500}>
          <View style={styles.quoteHeader}>
            <View style={styles.avatarSmallGold} />
            <View style={styles.cardTextGroup}>
              <View style={styles.textLineMedium} />
              <View style={styles.textLineShort} />
            </View>
          </View>
          <View style={styles.quotePrice}>
            <Text variant="button" color={colors.primary}>15 000 FCFA</Text>
          </View>
        </FloatingCard>
        <FloatingCard style={[styles.quoteCard, styles.quoteCardFront]} delay={700}>
          <View style={styles.quoteHeader}>
            <View style={styles.avatarSmallGreen} />
            <View style={styles.cardTextGroup}>
              <View style={styles.textLineMedium} />
              <View style={styles.textLineShort} />
            </View>
          </View>
          <View style={styles.quotePrice}>
            <Text variant="button" color={colors.primary}>12 500 FCFA</Text>
          </View>
          <View style={styles.quoteRating}>
            <Ionicons name="star" size={12} color={colors.secondary} />
            <Ionicons name="star" size={12} color={colors.secondary} />
            <Ionicons name="star" size={12} color={colors.secondary} />
            <Ionicons name="star" size={12} color={colors.secondary} />
            <Ionicons name="star" size={12} color={colors.secondary} />
          </View>
        </FloatingCard>
      </View>
    </View>
  );
}

function ProfessionalIllustration() {
  const stats = [
    { icon: 'mail-unread' as const, label: 'Demandes', delay: 300 },
    { icon: 'document-text' as const, label: 'Devis', delay: 450 },
    { icon: 'checkmark-done-circle' as const, label: 'Interventions', delay: 600 },
    { icon: 'trending-up' as const, label: 'Revenus', delay: 750 },
  ];

  return (
    <View style={styles.illustrationContainer}>
      <View style={styles.circleBg} />
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <FloatingCard key={stat.label} style={styles.statCard} delay={stat.delay}>
            <View style={styles.statIconWrap}>
              <Ionicons name={stat.icon} size={22} color={colors.primary} />
            </View>
            <Text variant="caption" color={colors.textSecondary} style={styles.statLabel}>
              {stat.label}
            </Text>
          </FloatingCard>
        ))}
      </View>
    </View>
  );
}

export function OnboardingIllustration({ type }: OnboardingIllustrationProps) {
  switch (type) {
    case 'discover':
      return <DiscoverIllustration />;
    case 'request':
      return <RequestIllustration />;
    case 'quotes':
      return <QuotesIllustration />;
    case 'professional':
      return <ProfessionalIllustration />;
  }
}

const styles = StyleSheet.create({
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 340,
  },
  circleBg: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.surfaceSecondary,
    opacity: 0.6,
  },
  heroIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  floatingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardTopRight: {
    position: 'absolute',
    top: 20,
    right: 16,
  },
  cardBottomLeft: {
    position: 'absolute',
    bottom: 30,
    left: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
  },
  avatarSmallGold: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
  },
  avatarSmallGreen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
  },
  cardTextGroup: {
    gap: spacing.xs,
  },
  textLineLong: {
    width: 80,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  textLineMedium: {
    width: 60,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  textLineShort: {
    width: 40,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  badgeGold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  badgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  flowContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  flowStep: {
    alignItems: 'center',
  },
  flowIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  flowLabel: {
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  flowArrow: {
    marginTop: spacing.xxs,
  },
  quotesStack: {
    alignItems: 'center',
    width: 220,
  },
  quoteCard: {
    width: 200,
    padding: spacing.md,
  },
  quoteCardBack: {
    position: 'absolute',
    top: 0,
    opacity: 0.4,
    transform: [{ scale: 0.9 }],
  },
  quoteCardMid: {
    position: 'absolute',
    top: 16,
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  quoteCardFront: {
    marginTop: 32,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quotePrice: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  quoteRating: {
    flexDirection: 'row',
    gap: 2,
    marginTop: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  statCard: {
    width: 130,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontWeight: '500',
  },
});
