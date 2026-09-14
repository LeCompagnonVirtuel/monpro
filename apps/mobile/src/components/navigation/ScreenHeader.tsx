import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text } from '@/components/ui';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    label: string;
    badge?: number;
  };
}

export function ScreenHeader({ title, onBack, rightAction }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack || (() => router.back())}
        accessibilityLabel="Retour"
        accessibilityRole="button"
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" numberOfLines={1} style={styles.headerTitle}>{title}</Text>
      {rightAction ? (
        <Pressable
          onPress={rightAction.onPress}
          accessibilityLabel={rightAction.label}
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Ionicons name={rightAction.icon} size={22} color={colors.text} />
          {rightAction.badge !== undefined && rightAction.badge > 0 && (
            <View style={styles.badge}>
              <Text variant="caption" color={colors.textInverse} style={styles.badgeText}>
                {rightAction.badge > 99 ? '99+' : rightAction.badge}
              </Text>
            </View>
          )}
        </Pressable>
      ) : (
        <View style={styles.backBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
