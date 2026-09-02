import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { Service } from '@/api/services';

interface TrendingServiceCardProps {
  service: Service;
}

export function TrendingServiceCard({ service }: TrendingServiceCardProps) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/(client)/service', params: { id: service.id } })}
      accessibilityLabel={service.name}
      accessibilityRole="button"
    >
      <View style={styles.imagePlaceholder}>
        <View style={styles.iconCircle}>
          <Ionicons name="construct-outline" size={22} color={colors.primary} />
        </View>
      </View>
      <View style={styles.labelWrap}>
        <Text variant="caption" numberOfLines={2} style={styles.label}>
          {service.name}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 130,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  imagePlaceholder: {
    width: '100%',
    height: 90,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  labelWrap: {
    padding: spacing.sm,
  },
  label: {
    lineHeight: 18,
  },
});
