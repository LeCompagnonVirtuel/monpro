import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { formatDistance } from '@/lib/format';

interface ProfessionalSheetProps {
  avatarUrl?: string;
  fullName: string;
  isVerified?: boolean;
  isAvailable?: boolean;
  averageRating?: number;
  totalReviews?: number;
  serviceName?: string;
  distanceMeters?: number;
  districtName?: string;
  onViewProfile: () => void;
  onRequestService: () => void;
}

export function ProfessionalSheet({
  avatarUrl,
  fullName,
  isVerified,
  isAvailable,
  averageRating,
  totalReviews,
  serviceName,
  distanceMeters,
  districtName,
  onViewProfile,
  onRequestService,
}: ProfessionalSheetProps) {
  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      <View style={styles.content}>
        <View style={styles.header}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={colors.textInverse} />
            </View>
          )}
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text variant="bodyMedium" numberOfLines={1}>{fullName}</Text>
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={10} color={colors.surface} />
                </View>
              )}
            </View>
            {serviceName && (
              <Text variant="caption" color={colors.textSecondary}>{serviceName}</Text>
            )}
            {averageRating != null && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text variant="caption" color={colors.textSecondary}>
                  {averageRating.toFixed(1)}{totalReviews ? ` (${totalReviews} avis)` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.details}>
          {districtName && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text variant="caption" color={colors.textSecondary}>{districtName}</Text>
            </View>
          )}
          {distanceMeters != null && (
            <View style={styles.detailRow}>
              <Ionicons name="navigate-outline" size={16} color={colors.textSecondary} />
              <Text variant="caption" color={colors.textSecondary}>{formatDistance(distanceMeters)}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons
              name={isAvailable ? 'radio-button-on' : 'radio-button-off'}
              size={16}
              color={isAvailable ? colors.success : colors.textTertiary}
            />
            <Text variant="caption" color={isAvailable ? colors.success : colors.textTertiary}>
              {isAvailable ? 'Disponible' : 'Occupé'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.profileBtn} onPress={onViewProfile}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <Text variant="bodySmall" color={colors.primary}>Voir le profil</Text>
          </Pressable>
          <Pressable style={styles.requestBtn} onPress={onRequestService}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.textInverse} />
            <Text variant="bodySmall" color={colors.textInverse}>Demander ce service</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

interface RequestSheetProps {
  title: string;
  categoryName?: string;
  districtName?: string;
  distanceKm?: number;
  createdAt: string;
  description?: string;
  urgency?: string;
  onViewDetail: () => void;
  onCreateQuote: () => void;
}

export function RequestSheet({
  title,
  categoryName,
  districtName,
  distanceKm,
  createdAt,
  description,
  urgency,
  onViewDetail,
  onCreateQuote,
}: RequestSheetProps) {
  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      <View style={styles.content}>
        <Text variant="bodyMedium" style={styles.requestTitle}>{title}</Text>

        <View style={styles.details}>
          {categoryName && (
            <View style={styles.detailRow}>
              <Ionicons name="pricetag-outline" size={16} color={colors.info} />
              <Text variant="caption" color={colors.textSecondary}>{categoryName}</Text>
            </View>
          )}
          {districtName && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text variant="caption" color={colors.textSecondary}>{districtName}</Text>
            </View>
          )}
          {distanceKm != null && (
            <View style={styles.detailRow}>
              <Ionicons name="navigate-outline" size={16} color={colors.textSecondary} />
              <Text variant="caption" color={colors.textSecondary}>{distanceKm.toFixed(1)} km</Text>
            </View>
          )}
        </View>

        {description && (
          <Text variant="caption" color={colors.textSecondary} numberOfLines={3} style={styles.description}>
            {description}
          </Text>
        )}

        <View style={styles.actions}>
          <Pressable style={styles.profileBtn} onPress={onViewDetail}>
            <Ionicons name="eye-outline" size={18} color={colors.primary} />
            <Text variant="bodySmall" color={colors.primary}>Voir la demande</Text>
          </Pressable>
          <Pressable style={styles.requestBtn} onPress={onCreateQuote}>
            <Ionicons name="document-text-outline" size={18} color={colors.textInverse} />
            <Text variant="bodySmall" color={colors.textInverse}>Faire un devis</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  details: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  description: {
    lineHeight: 18,
  },
  requestTitle: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  profileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  requestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
});
