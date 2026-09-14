import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type IconPosition = 'left' | 'right';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: IconPosition;
  fullWidth?: boolean;
}

const HEIGHT: Record<ButtonSize, number> = { sm: 36, md: 48, lg: 56 };
const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 20, lg: 22 };

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  icon,
  iconPosition = 'left',
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const bgColor = {
    primary: isDisabled ? colors.primaryLight : colors.primary,
    secondary: colors.secondary,
    outline: colors.transparent,
    ghost: colors.transparent,
  }[variant];

  const textColor = {
    primary: colors.textInverse,
    secondary: colors.text,
    outline: colors.primary,
    ghost: colors.primary,
  }[variant];

  const borderColor = variant === 'outline' ? colors.primary : colors.transparent;

  const iconElement = icon ? (
    <Ionicons
      name={icon}
      size={ICON_SIZE[size]}
      color={textColor}
      style={iconPosition === 'left' ? { marginRight: spacing.xs } : { marginLeft: spacing.xs }}
    />
  ) : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          backgroundColor: bgColor,
          borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: pressed ? 0.85 : isDisabled ? 0.6 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {iconElement && iconPosition === 'left' && iconElement}
          <Text variant={size === 'sm' ? 'buttonSmall' : 'button'} color={textColor}>
            {title}
          </Text>
          {iconElement && iconPosition === 'right' && iconElement}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
