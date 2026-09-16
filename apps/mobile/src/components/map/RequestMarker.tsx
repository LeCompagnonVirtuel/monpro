import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Marker } from 'react-native-maps';
import { colors } from '@/theme/colors';

const URGENCY_COLORS: Record<string, string> = {
  URGENT: colors.error,
  HIGH: colors.warning,
  NORMAL: colors.info,
  LOW: colors.textTertiary,
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Plomberie': 'water-outline',
  'Électricité': 'flash-outline',
  'Peinture': 'color-palette-outline',
  'Ménage': 'sparkles-outline',
  'Réparation': 'construct-outline',
  'Climatisation': 'snow-outline',
  'Jardinage': 'leaf-outline',
  'Serrurerie': 'key-outline',
  'Auto': 'car-outline',
  'Informatique': 'laptop-outline',
};

interface RequestMarkerProps {
  latitude: number;
  longitude: number;
  categoryName?: string;
  urgency?: string;
  onPress?: () => void;
}

export function RequestMarker({
  latitude,
  longitude,
  categoryName,
  urgency = 'NORMAL',
  onPress,
}: RequestMarkerProps) {
  const iconColor = URGENCY_COLORS[urgency] || colors.info;
  const iconName = CATEGORY_ICONS[categoryName || ''] || 'location-outline';

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={styles.container}>
        <View style={[styles.bubble, { borderColor: iconColor + '40' }]}>
          <View style={[styles.iconCircle, { backgroundColor: iconColor + '15' }]}>
            <Ionicons name={iconName} size={18} color={iconColor} />
          </View>
        </View>
        <View style={[styles.arrow, { borderTopColor: iconColor + '40' }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 44,
  },
  bubble: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
