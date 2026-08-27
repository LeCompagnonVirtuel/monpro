import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

type FilterType = 'all' | 'requests' | 'projects' | 'notifications';

interface MessageFilterChipsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  notificationCount?: number;
}

const FILTERS: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'Tous', icon: 'chatbubbles' },
  { key: 'requests', label: 'Demandes', icon: 'people-outline' },
  { key: 'projects', label: 'Projets', icon: 'briefcase-outline' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
];

export function MessageFilterChips({ activeFilter, onFilterChange, notificationCount }: MessageFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.key;
        return (
          <Pressable
            key={filter.key}
            style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
            onPress={() => onFilterChange(filter.key)}
            accessibilityLabel={filter.label}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={filter.icon}
              size={16}
              color={isActive ? colors.textInverse : colors.primary}
            />
            <Text
              variant="caption"
              color={isActive ? colors.textInverse : colors.text}
              style={styles.chipLabel}
            >
              {filter.label}
            </Text>
            {filter.key === 'notifications' && notificationCount != null && notificationCount > 0 && (
              <View style={styles.dotBadge} />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    ...shadows.sm,
  },
  chipLabel: {
    fontWeight: '600',
    fontSize: 13,
  },
  dotBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    marginLeft: spacing.xxs,
  },
});
