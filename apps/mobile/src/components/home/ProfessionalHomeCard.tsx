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
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
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
            <Ionicons name="person" size={32} color={colors.textTertiary} />
          </View>
        )}

        <View style={styles.photoOverlay} />

        {professional.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
            <Text variant="caption" color={colors.textInverse} style={styles.verifiedLabel}>
              Vérifié
            </Text>
          </View>
        )}

        <Pressable
          style={styles.favBtn}
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
        <View style={styles.nameRow}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
            {displayName}
          </Text>
          {professional.averageRating != null && professional.averageRating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color={colors.secondary} />
              <Text variant="caption" style={styles.ratingValue}>
                {professional.averageRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

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
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  photoSection: {
    width: '100%',
    height: 110,
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
    backgroundColor: colors.surfaceSecondary,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  verifiedBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  verifiedLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  favBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: spacing.md,
    gap: spacing.xxs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.goldTintLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  ratingValue: {
    fontWeight: '700',
    fontSize: 11,
    color: colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
});
