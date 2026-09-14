import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, style, ...props }: InputProps) {
  const isMultiline = props.multiline;

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          isMultiline && styles.multiline,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={colors.textTertiary}
        textAlignVertical={isMultiline ? 'top' : 'center'}
        {...props}
      />
      {(error || helperText) && (
        <Text
          variant="caption"
          color={error ? colors.error : colors.textTertiary}
          style={styles.hint}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.body.fontSize,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  multiline: {
    height: 120,
    paddingTop: spacing.md,
  },
  inputError: {
    borderColor: colors.error,
  },
  hint: {
    marginTop: spacing.xs,
  },
});
