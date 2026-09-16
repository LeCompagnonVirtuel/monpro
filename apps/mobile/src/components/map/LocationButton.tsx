import { StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface LocationButtonProps {
  onPress: () => void;
  isLoading?: boolean;
}

export function LocationButton({ onPress, isLoading }: LocationButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
      disabled={isLoading}
      accessibilityLabel="Ma position"
      accessibilityRole="button"
    >
      <Ionicons
        name={isLoading ? 'location' : 'locate-outline'}
        size={22}
        color={colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});
