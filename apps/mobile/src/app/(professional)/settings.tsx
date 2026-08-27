import { StyleSheet, View, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text } from '@/components/ui';
import { useMyProfessionalProfile, useUpdateProfessionalProfile } from '@/hooks/use-professional-profile';

export default function SettingsScreen() {
  const { data: profile } = useMyProfessionalProfile();
  const updateProfile = useUpdateProfessionalProfile();

  const handleToggleAvailability = () => {
    if (!profile) return;
    updateProfile.mutate({ id: profile.id, isAvailable: !profile.isAvailable });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="h3" style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text variant="body" color={colors.textSecondary}>Disponibilité</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="body">Accepter les nouvelles demandes</Text>
              <Text variant="bodySmall" color={colors.textTertiary}>
                Désactivez pour ne plus recevoir de nouvelles demandes.
              </Text>
            </View>
            <Switch
              value={profile?.isAvailable ?? true}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: colors.borderLight, true: colors.primary + '60' }}
              thumbColor={profile?.isAvailable ? colors.primary : colors.textTertiary}
              disabled={updateProfile.isPending}
              accessibilityLabel="Disponibilité"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="body" color={colors.textSecondary}>Compte</Text>
          <Pressable style={styles.menuItem} onPress={() => router.push('/(professional)/onboarding' as never)}>
            <Ionicons name="person-outline" size={20} color={colors.text} />
            <Text variant="body" style={styles.menuLabel}>Modifier mon profil</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => router.push('/(professional)/availability' as never)}>
            <Ionicons name="time-outline" size={20} color={colors.text} />
            <Text variant="body" style={styles.menuLabel}>Disponibilités</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => router.push('/(professional)/services' as never)}>
            <Ionicons name="list-outline" size={20} color={colors.text} />
            <Text variant="body" style={styles.menuLabel}>Services</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text variant="body" color={colors.textSecondary}>Application</Text>
          <View style={styles.infoRow}>
            <Text variant="bodySmall" color={colors.textTertiary}>Version</Text>
            <Text variant="bodySmall" color={colors.textTertiary}>1.0.0</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  content: { flex: 1, padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  settingInfo: { flex: 1, gap: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  menuLabel: { flex: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md },
});
