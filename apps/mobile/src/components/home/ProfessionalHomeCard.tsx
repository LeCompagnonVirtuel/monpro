import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { Professional } from '@/api/professionals';
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from '@/hooks/use-favorites';

interface ProfessionalHomeCardProps {
  professional: Professional;
}

export function ProfessionalHomeCard({ professional }: ProfessionalHomeCardProps) {
  const fullName = professional.user?.fullName || professional.businessName || 'Professionnel';
  const nameParts = fullName.split(' ');
  const displayName = nameParts.length > 1
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1].charAt(0)}.`
    : fullName;
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
      accessibilityLabel={`${fullName}, ${profession}${professional.isVerified ? ', vérifié' : ''}`}
      accessibilityRole="button"
    >
      <View style={styles.photoSection}>
        {professional.user?.avatarUrl ? (
          <Image
            source={{ uri: professional.user.avatarUrl }}
            style={styles.photo}
            contentFit="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person" size={36} color={colors.textTertiary} />
          </View>
        )}

        <Pressable
          style={[styles.favBtn, isFav && styles.favBtnActive]}
          onPress={toggleFavorite}
          accessibilityLabel={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          accessibilityRole="button"
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={16}
            color={isFav ? colors.error : colors.textInverse}
          />
        </Pressable>
      </View>

      <View style={styles.info}>
        {professional.averageRating != null && professional.averageRating > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={colors.secondary} />
            <Text variant="caption" style={styles.ratingValue}>
              {professional.averageRating.toFixed(1)}
            </Text>
            {professional.totalReviews != null && professional.totalReviews > 0 && (
              <Text variant="caption" color={colors.textTertiary}>
                ({professional.totalReviews})
              </Text>
            )}
          </View>
        )}

        <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
          {displayName}
        </Text>

        <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {profession}
        </Text>

        {zone ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
            <Text variant="caption" color={colors.textTertiary} numberOfLines={1}>
              {zone}
            </Text>
          </View>
        ) : null}

        {professional.isVerified && (
          <View style={styles.verifiedPill}>
            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
            <Text variant="caption" color={colors.success} style={styles.verifiedLabel}>
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
    borderRadius: radius.xl,
    width: 165,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  photoSection: {
    width: '100%',
    height: 120,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBtnActive: {
    backgroundColor: colors.errorLight,
  },
  info: {
    padding: spacing.md,
    gap: spacing.xxs,
  },
  name: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
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
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xxs,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  verifiedLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});
