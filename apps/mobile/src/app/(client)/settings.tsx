import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { messages } from '@/constants/messages';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  type: 'toggle' | 'link';
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  accessibilityLabel?: string;
}

function SettingRow({ icon, label, type, value, onValueChange, onPress, accessibilityLabel }: SettingRowProps) {
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
          accessibilityLabel={accessibilityLabel || label}
        />
      ) : (
        <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel || label} accessibilityRole="button">
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>
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
      Alert.alert(messages.common.error, messages.errors.updateSetting);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} accessibilityLabel={messages.common.back} accessibilityRole="button">
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.text}
            />
          </Pressable>
          <Text variant="h2" color={colors.text}>{messages.settings.title}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.sectionTitle}>
            {messages.settings.sectionAccount}
          </Text>
          <View style={styles.card}>
            <SettingRow
              icon="wallet-outline"
              label={messages.settings.paymentMethods}
              type="link"
              onPress={() => router.push('/(client)/payment-methods')}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="time-outline"
              label={messages.settings.history}
              type="link"
              onPress={() => router.push('/(client)/history')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.sectionTitle}>
            {messages.settings.sectionNotifications}
          </Text>
          <View style={styles.card}>
            <SettingRow
              icon="notifications-outline"
              label={messages.settings.pushNotifications}
              type="toggle"
              value={settings?.pushEnabled ?? true}
              onValueChange={(v) => handleToggle('pushEnabled', v)}
              accessibilityLabel={messages.settings.accessibilityPushNotifications}
            />
          </View>
          <Text variant="caption" color={colors.textTertiary} style={styles.settingNote}>
            {messages.settings.pushNotificationsDesc}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.sectionTitle}>
            {messages.settings.sectionPreferences}
          </Text>
          <View style={styles.card}>
            <SettingRow
              icon="eye-outline"
              label={messages.settings.profileVisible}
              type="toggle"
              value={settings?.profileVisible ?? true}
              onValueChange={(v) => handleToggle('profileVisible', v)}
              accessibilityLabel={messages.settings.accessibilityProfileVisible}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="map-outline"
              label={messages.settings.locationData}
              type="toggle"
              value={settings?.locationEnabled ?? true}
              onValueChange={(v) => handleToggle('locationEnabled', v)}
              accessibilityLabel={messages.settings.accessibilityLocation}
            />
          </View>
          <Text variant="caption" color={colors.textTertiary} style={styles.settingNote}>
            {messages.settings.profileVisibleDesc}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.sectionTitle}>
            {messages.settings.sectionAbout}
          </Text>
          <View style={styles.card}>
            <View style={aboutStyles.row}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              <Text variant="body" style={aboutStyles.label}>{messages.settings.versionTitle}</Text>
              <Text variant="body" color={colors.textSecondary}>1.0.0</Text>
            </View>
            <View style={styles.separator} />
            <SettingRow
              icon="document-text-outline"
              label={messages.settings.termsTitle}
              type="link"
              onPress={() => router.push('/(client)/terms')}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="shield-checkmark-outline"
              label={messages.settings.privacyTitle}
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
  settingNote: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
