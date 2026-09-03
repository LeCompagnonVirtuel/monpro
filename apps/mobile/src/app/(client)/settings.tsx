import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  type: 'toggle' | 'link';
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
}

function SettingRow({ icon, label, type, value, onValueChange, onPress }: SettingRowProps) {
  return (
    <View style={settingStyles.row}>
      <View style={settingStyles.iconWrap}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
      </View>
      <Text variant="body" style={settingStyles.label}>{label}</Text>
      {type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={value ? colors.secondary : colors.textTertiary}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} onPress={onPress} />
      )}
    </View>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
});

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const handleToggle = async (key: 'pushEnabled' | 'emailEnabled' | 'profileVisible' | 'locationEnabled', value: boolean) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le paramètre. Veuillez réessayer.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.text}
            onPress={() => router.back()}
          />
          <Text variant="h2" color={colors.text}>Paramètres</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.sectionTitle}>
            Compte
          </Text>
          <View style={styles.card}>
            <SettingRow
              icon="wallet-outline"
              label="Moyens de paiement"
              type="link"
              onPress={() => router.push('/(client)/payment-methods')}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="time-outline"
              label="Historique"
              type="link"
              onPress={() => router.push('/(client)/history')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.sectionTitle}>
            Notifications
          </Text>
          <View style={styles.card}>
            <SettingRow
              icon="notifications-outline"
              label="Notifications push"
              type="toggle"
              value={settings?.pushEnabled ?? true}
              onValueChange={(v) => handleToggle('pushEnabled', v)}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="mail-outline"
              label="Notifications par e-mail"
              type="toggle"
              value={settings?.emailEnabled ?? false}
              onValueChange={(v) => handleToggle('emailEnabled', v)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.sectionTitle}>
            Confidentialité
          </Text>
          <View style={styles.card}>
            <SettingRow
              icon="eye-outline"
              label="Profil visible"
              type="toggle"
              value={settings?.profileVisible ?? true}
              onValueChange={(v) => handleToggle('profileVisible', v)}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="map-outline"
              label="Données de localisation"
              type="toggle"
              value={settings?.locationEnabled ?? true}
              onValueChange={(v) => handleToggle('locationEnabled', v)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.sectionTitle}>
            À propos
          </Text>
          <View style={styles.card}>
            <View style={aboutStyles.row}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              <Text variant="body" style={aboutStyles.label}>Version</Text>
              <Text variant="body" color={colors.textSecondary}>1.0.0</Text>
            </View>
            <View style={styles.separator} />
            <SettingRow
              icon="document-text-outline"
              label="Conditions d'utilisation"
              type="link"
              onPress={() => router.push('/(client)/terms')}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="shield-checkmark-outline"
              label="Politique de confidentialité"
              type="link"
              onPress={() => router.push('/(client)/privacy-policy')}
            />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const aboutStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  label: {
    flex: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    paddingVertical: spacing.xs,
    ...shadows.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.lg + 32 + spacing.md,
    marginRight: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
