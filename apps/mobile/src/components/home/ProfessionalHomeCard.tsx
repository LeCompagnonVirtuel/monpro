import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Avatar } from '@/components/ui';
import { Professional } from '@/api/professionals';

interface ProfessionalHomeCardProps {
  professional: Professional;
}

export function ProfessionalHomeCard({ professional }: ProfessionalHomeCardProps) {
  const name = professional.user?.fullName || professional.businessName || 'Professionnel';
  const shortName = name.split(' ').map((w, i) => i === 0 ? w : `${w[0]}.`).join(' ');
  const profession = professional.services?.[0]?.name || 'Professionnel';

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/(client)/professional', params: { id: professional.id } })}
      accessibilityLabel={`${name}, ${profession}`}
      accessibilityRole="button"
    >
      <View style={styles.avatarWrap}>
        <Avatar
          uri={professional.user?.avatarUrl}
          name={name}
          size={56}
        />
        {professional.isAvailable && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
            {shortName}
          </Text>
          {professional.isVerified && (
            <Ionicons name="checkmark-circle" size={13} color={colors.info} />
          )}
        </View>

        <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {profession}
        </Text>

        {professional.averageRating != null && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color={colors.secondary} />
            <Text variant="caption" style={styles.ratingText}>
              {professional.averageRating.toFixed(1)}
            </Text>
            {professional.totalReviews != null && (
              <Text variant="caption" color={colors.textTertiary}>
                ({professional.totalReviews})
              </Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: 150,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  info: {
    alignItems: 'center',
    gap: spacing.xxs,
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  name: {
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  ratingText: {
    fontWeight: '600',
    fontSize: 12,
  },
});
