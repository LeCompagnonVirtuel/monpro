import { Image, StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';
import { Text } from './Text';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const borderRadius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
        accessibilityLabel={name || 'Avatar'}
      />
    );
  }

  return (
    <View
      style={[styles.placeholder, { width: size, height: size, borderRadius }]}
      accessibilityLabel={name || 'Avatar'}
    >
      <Text variant="button" color={colors.textInverse}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceSecondary,
  },
  placeholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
