import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Avatar } from '@/components/ui';
import { Professional } from '@/api/professionals';
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from '@/hooks/use-favorites';

interface ProfessionalHomeCardProps {
  professional: Professional;
}

export function ProfessionalHomeCard({ professional }: ProfessionalHomeCardProps) {
  const name = professional.user?.fullName || professional.businessName || 'Professionnel';
  const profession = professional.services?.[0]?.service?.name || 'Professionnel';
  const zone = professional.zones?.[0]?.name || '';
  const { data: isFav } = useIsFavorite(professional.id);
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();

  const toggleFavorite = () => {
    if (isFav) {
      removeFav.mutate(professional.id);
    } else {
      addFav.mutate(professional.id);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={() => router.push({ pathname: '/(client)/professional', params: { id: professional.id } })}
      accessibilityLabel={`${name}, ${profession}${professional.isVerified ? ', vérifié' : ''}`}
      accessibilityRole="button"
    >
      <View style={styles.topSection}>
        <Avatar uri={professional.user?.avatarUrl} name={name} size={72} />

        <Pressable
          style={[styles.favBtn, isFav && styles.favBtnActive]}
          onPress={toggleFavorite}
          accessibilityLabel={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          accessibilityRole="button"
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={18}
            color={isFav ? colors.error : colors.textTertiary}
          />
        </Pressable>

        {professional.isVerified && (
          <View style={styles.verifiedPill}>
            <Ionicons name="shield-checkmark" size={10} color={colors.textInverse} />
            <Text variant="caption" color={colors.textInverse} style={styles.verifiedLabel}>
              Vérifié
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
          {name}
        </Text>

        <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {profession}
        </Text>

        {professional.averageRating != null && professional.averageRating > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={colors.secondary} />
            <Text variant="caption" style={styles.ratingValue}>
              {professional.averageRating.toFixed(1)}
            </Text>
            {professional.totalReviews != null && professional.totalReviews > 0 && (
              <Text variant="caption" color={colors.textTertiary}>
                ({professional.totalReviews} avis)
              </Text>
            )}
          </View>
        )}

        {zone ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
            <Text variant="caption" color={colors.textTertiary} numberOfLines={1}>
              {zone}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: 170,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  topSection: {
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  favBtn: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  favBtnActive: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.info,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  verifiedLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  info: {
    alignItems: 'center',
    gap: spacing.xxs,
    width: '100%',
  },
  name: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  ratingValue: {
    fontWeight: '700',
    fontSize: 13,
    color: colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
});
