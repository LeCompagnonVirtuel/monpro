import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Marker } from 'react-native-maps';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { Text } from '@/components/ui';

interface ProfessionalMarkerProps {
  latitude: number;
  longitude: number;
  avatarUrl?: string;
  fullName: string;
  isAvailable?: boolean;
  isVerified?: boolean;
  averageRating?: number;
  onPress?: () => void;
}

export function ProfessionalMarker({
  latitude,
  longitude,
  avatarUrl,
  fullName,
  isAvailable = false,
  isVerified = false,
  averageRating,
  onPress,
}: ProfessionalMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude, longitude }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={styles.container}>
        <View style={[styles.avatarBorder, { borderColor: isAvailable ? colors.success : colors.textTertiary }]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color={colors.textInverse} />
            </View>
          )}
        </View>
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={10} color={colors.surface} />
          </View>
        )}
        <View style={styles.pin} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 48,
  },
  avatarBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  pin: {
    width: 2,
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
});
