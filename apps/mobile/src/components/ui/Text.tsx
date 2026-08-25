import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { typography, TypographyVariant } from '@/theme/typography';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle['textAlign'];
}

export function Text({
  variant = 'body',
  color = colors.text,
  align,
  style,
  ...props
}: AppTextProps) {
  return (
    <RNText
      style={[typography[variant], { color, textAlign: align }, style]}
      {...props}
    />
  );
}
