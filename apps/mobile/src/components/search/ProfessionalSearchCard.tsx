import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Avatar } from '@/components/ui';
import { Professional } from '@/api/professionals';

interface ProfessionalSearchCardProps {
  professional: Professional;
}

export function ProfessionalSearchCard({ professional }: ProfessionalSearchCardProps) {
  const name = professional.user?.fullName || professional.businessName || 'Professionnel';
  const profession = professional.services?.[0]?.name || 'Professionnel';
  const isVerified = professional.verificationStatus === 'VERIFIED';
  const isAvailable = professional.isAvailable;
  const servicesTags = professional.services?.slice(0, 3) || [];
  const extraCount = (professional.services?.length || 0) - 3;

  return (
    <View style={styles.card}>
      {/* Top section: Avatar + Info + Availability/Price */}
      <View style={styles.topRow}>
        {/* Avatar with availability dot */}
        <View style={styles.avatarContainer}>
          <Avatar
            uri={professional.user?.avatarUrl}
            name={name}
            size={72}
          />
          <View style={[styles.statusDot, isAvailable ? styles.dotOnline : styles.dotOffline]} />
        </View>

        {/* Info column */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text variant="body" numberOfLines={1} style={styles.name}>
              {name}
            </Text>
            {isVerified && (
              <Ionicons name="checkmark-circle" size={16} color={colors.info} />
            )}
          </View>

          <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {profession}
          </Text>

          {professional.rating != null && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.secondary} />
              <Text variant="caption" style={styles.ratingValue}>
                {professional.rating.toFixed(1)}
              </Text>
              {professional.reviewCount != null && (
                <Text variant="caption" color={colors.textTertiary}>
                  ({professional.reviewCount} avis)
                </Text>
              )}
            </View>
          )}

          {professional.businessName && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
              <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {professional.businessName}
              </Text>
            </View>
          )}
        </View>

        {/* Right column: availability + price */}
        <View style={styles.rightCol}>
          <View style={styles.availabilityBadge}>
            <View style={[styles.availDot, isAvailable ? styles.dotOnlineSmall : styles.dotOfflineSmall]} />
            <Text
              variant="caption"
              color={isAvailable ? colors.success : colors.textTertiary}
              style={styles.availText}
            >
              {isAvailable ? 'Disponible' : 'Hors ligne'}
            </Text>
          </View>

          <View style={styles.priceBlock}>
            <View style={styles.priceRow}>
              <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
              <Text variant="caption" color={colors.textTertiary}>
                {"À partir de"}
              </Text>
            </View>
            <Text variant="body" style={styles.priceValue}>
              Tarif sur devis
            </Text>
          </View>
        </View>
      </View>

      {/* Tags row */}
      {servicesTags.length > 0 && (
        <View style={styles.tagsRow}>
          {servicesTags.map((s) => (
            <View key={s.id} style={styles.tag}>
              <Text variant="caption" color={colors.text} style={styles.tagText}>
                {s.name}
              </Text>
            </View>
          ))}
          {extraCount > 0 && (
            <View style={styles.tag}>
              <Text variant="caption" color={colors.textSecondary} style={styles.tagText}>
                +{extraCount}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* CTA button */}
      <View style={styles.ctaRow}>
        <Pressable
          style={styles.profileButton}
          onPress={() => router.push({ pathname: '/(client)/professional', params: { id: professional.id } })}
          accessibilityLabel={`Voir le profil de ${name}`}
          accessibilityRole="button"
        >
          <Text variant="caption" color={colors.textInverse} style={styles.profileButtonText}>
            Voir le profil
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  dotOnline: {
    backgroundColor: colors.success,
  },
  dotOffline: {
    backgroundColor: colors.textTertiary,
  },
  infoCol: {
    flex: 1,
    gap: spacing.xxs,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingValue: {
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  availDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnlineSmall: {
    backgroundColor: colors.success,
  },
  dotOfflineSmall: {
    backgroundColor: colors.textTertiary,
  },
  availText: {
    fontWeight: '500',
    fontSize: 11,
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  priceValue: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontWeight: '500',
    fontSize: 12,
  },
  ctaRow: {
    alignItems: 'flex-end',
  },
  profileButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  profileButtonText: {
    fontWeight: '600',
    fontSize: 13,
  },
});
