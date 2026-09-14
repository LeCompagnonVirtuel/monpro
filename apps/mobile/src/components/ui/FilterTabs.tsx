import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

export interface FilterTab {
  key: string;
  label: string;
  count?: number;
  isNew?: boolean;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: 'pill' | 'flat';
}

export function FilterTabs({ tabs, activeKey, onChange, variant = 'pill' }: FilterTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            style={[
              variant === 'pill' ? styles.pill : styles.flatTab,
              isActive && (variant === 'pill' ? styles.pillActive : styles.flatTabActive),
            ]}
            onPress={() => onChange(tab.key)}
            accessibilityLabel={`${tab.label}${tab.count !== undefined ? ` ${tab.count}` : ''}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              variant={variant === 'pill' ? 'bodySmall' : 'caption'}
              color={isActive
                ? (variant === 'pill' ? colors.textInverse : colors.primary)
                : (variant === 'pill' ? colors.text : colors.textSecondary)
              }
              style={styles.tabLabel}
            >
              {tab.label}
            </Text>
            {tab.isNew && !isActive && (tab.count ?? 0) > 0 && (
              <View style={styles.newDot} />
            )}
            {tab.count !== undefined && (
              <View style={[
                styles.countBadge,
                isActive && (variant === 'pill' ? styles.countBadgeActive : styles.countBadgeFlatActive),
              ]}>
                <Text
                  variant="caption"
                  color={isActive
                    ? (variant === 'pill' ? colors.primary : colors.primary)
                    : colors.textSecondary
                  }
                  style={styles.countText}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  flatTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  flatTabActive: {
    backgroundColor: colors.primaryLight,
  },
  tabLabel: {
    fontWeight: '600',
  },
  newDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  countBadge: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countBadgeFlatActive: {
    backgroundColor: colors.primaryLight,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
