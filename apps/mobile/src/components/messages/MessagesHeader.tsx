import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text } from '@/components/ui';

interface MessagesHeaderProps {
  onSearchPress?: () => void;
  onMenuPress?: () => void;
}

export function MessagesHeader({ onSearchPress, onMenuPress }: MessagesHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Text variant="h1" style={styles.title}>
        Messages
      </Text>

      <View style={styles.actions}>
        <Pressable
          style={styles.iconButton}
          onPress={onSearchPress}
          accessibilityLabel="Rechercher dans les messages"
          accessibilityRole="button"
        >
          <Ionicons name="search-outline" size={24} color={colors.text} />
        </Pressable>

        <Pressable
          style={styles.iconButton}
          onPress={onMenuPress}
          accessibilityLabel="Ouvrir le menu des messages"
          accessibilityRole="button"
        >
          <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontWeight: '800',
    fontSize: 26,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconButton: {
    padding: spacing.xs,
  },
});
