import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
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
        <Ionicons name="construct-outline" size={28} color={colors.primary} />
      </View>
      <Text variant="caption" numberOfLines={2} style={styles.label}>
        {service.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    padding: spacing.sm,
  },
});
