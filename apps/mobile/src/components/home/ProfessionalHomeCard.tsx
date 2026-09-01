import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Avatar } from '@/components/ui';
import { Professional } from '@/api/professionals';

interface ProfessionalHomeCardProps {
  professional: Professional;
}

export function ProfessionalHomeCard({ professional }: ProfessionalHomeCardProps) {
  const name = professional.user?.fullName || professional.businessName || 'Professionnel';
  const shortName = name.split(' ').map((w, i) => i === 0 ? w : `${w[0]}.`).join(' ');
  const profession = professional.services?.[0]?.name || 'Professionnel';
  const city = professional.businessName || '';

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/(client)/professional', params: { id: professional.id } })}
      accessibilityLabel={`${name}, ${profession}`}
      accessibilityRole="button"
    >
      <Avatar
        uri={professional.user?.avatarUrl}
        name={name}
        size={64}
      />

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
            {shortName}
          </Text>
          {professional.isVerified && (
            <Ionicons name="checkmark-circle" size={14} color={colors.info} />
          )}
        </View>

        <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {profession}
        </Text>

        {professional.averageRating != null && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={colors.secondary} />
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

        {city ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
            <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {city}
            </Text>
          </View>
        ) : null}

        <View style={styles.availableRow}>
          <View style={[styles.greenDot, !professional.isAvailable && styles.dotOffline]} />
          <Text variant="caption" color={professional.isAvailable ? colors.success : colors.textTertiary}>
            {professional.isAvailable ? 'Disponible' : 'Hors ligne'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: 160,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
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
  name: {},
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  ratingText: {},
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  dotOffline: {
    backgroundColor: colors.textTertiary,
  },
});
