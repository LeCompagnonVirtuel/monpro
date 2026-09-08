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
  const shortName = name.split(' ').map((w, i) => i === 0 ? w : `${w[0]}.`).join(' ');
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
      style={styles.card}
      onPress={() => router.push({ pathname: '/(client)/professional', params: { id: professional.id } })}
      accessibilityLabel={`${name}, ${profession}${professional.isVerified ? ', vérifié' : ''}`}
      accessibilityRole="button"
    >
      <View style={styles.imageArea}>
        <Avatar uri={professional.user?.avatarUrl} name={name} size={64} />
        <Pressable
          style={styles.favBtn}
          onPress={toggleFavorite}
          accessibilityLabel={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          accessibilityRole="button"
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={16}
            color={isFav ? colors.error : colors.textTertiary}
          />
        </Pressable>
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

        {professional.averageRating != null && professional.averageRating > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color={colors.secondary} />
            <Text variant="caption" style={styles.ratingText}>
              {professional.averageRating.toFixed(1)}
            </Text>
            {professional.totalReviews != null && professional.totalReviews > 0 && (
              <Text variant="caption" color={colors.textTertiary}>
                ({professional.totalReviews})
              </Text>
            )}
          </View>
        )}

        {zone ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={10} color={colors.textTertiary} />
            <Text variant="caption" color={colors.textTertiary} numberOfLines={1}>
              {zone}
            </Text>
          </View>
        ) : null}

        {professional.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={10} color={colors.info} />
            <Text variant="caption" color={colors.info} style={styles.verifiedText}>
              Vérifié
            </Text>
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
    width: 160,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  imageArea: {
    position: 'relative',
  },
  favBtn: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
