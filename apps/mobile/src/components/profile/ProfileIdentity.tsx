import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Avatar } from '@/components/ui';

interface ProfileIdentityProps {
  fullName: string;
  avatarUrl?: string;
  location?: string;
  onCameraPress?: () => void;
}

export function ProfileIdentity({ fullName, avatarUrl, location, onCameraPress }: ProfileIdentityProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Avatar uri={avatarUrl} name={fullName} size={100} />
        <Pressable
          style={styles.cameraButton}
          onPress={onCameraPress}
          accessibilityLabel="Modifier la photo de profil"
          accessibilityRole="button"
        >
          <Ionicons name="camera" size={16} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.info}>
        <Text variant="h2" style={styles.name}>
          {fullName || 'Chargement...'}
        </Text>

        <View style={styles.badge}>
          <Ionicons name="person-outline" size={12} color={colors.textInverse} />
          <Text variant="caption" color={colors.textInverse} style={styles.badgeText}>
            Client
          </Text>
        </View>

        {location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text variant="bodySmall" color={colors.textSecondary}>
              {location}
            </Text>
          </View>
        ) : (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.textTertiary} />
            <Text variant="bodySmall" color={colors.textTertiary}>
              Localisation non renseignée
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  info: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontWeight: '700',
    fontSize: 22,
    color: colors.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
