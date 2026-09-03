import { StyleSheet, View, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAuthStore } from '@/stores/auth.store';
import { useMyProfessionalProfile, useUpdateProfessionalProfile } from '@/hooks/use-professional-profile';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

export default function SettingsScreen() {
  const logout = useAuthStore((s) => s.logout);
  const { data: profile, isLoading, isError, refetch } = useMyProfessionalProfile();
  const updateProfile = useUpdateProfessionalProfile();

  const handleToggleAvailability = () => {
    if (!profile) return;
    updateProfile.mutate({ id: profile.id, isAvailable: !profile.isAvailable });
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.skeletonContent}>
          <Skeleton width="30%" height={16} />
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonRow}>
              <View style={styles.skeletonRowText}>
                <Skeleton width="60%" height={18} />
                <Skeleton width="80%" height={14} />
              </View>
              <Skeleton width={44} height={24} borderRadius={12} />
            </View>
          </View>
          <Skeleton width="25%" height={16} />
          <View style={styles.skeletonCard}>
            <Skeleton width="100%" height={48} />
            <Skeleton width="100%" height={48} />
            <Skeleton width="100%" height={48} />
          </View>
          <Skeleton width="30%" height={16} />
          <View style={styles.skeletonCard}>
            <Skeleton width="100%" height={48} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState
          message="Impossible de charger vos paramètres."
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {profile && (
          <View style={styles.section}>
            <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
              DISPONIBILITÉ
            </Text>
            <View style={styles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text variant="body">Accepter les nouvelles demandes</Text>
                  <Text variant="caption" color={colors.textTertiary}>
                    Désactivez pour ne plus recevoir de demandes.
                  </Text>
                </View>
                <Switch
                  value={profile.isAvailable}
                  onValueChange={handleToggleAvailability}
                  trackColor={{ false: colors.borderLight, true: colors.primary + '60' }}
                  thumbColor={profile.isAvailable ? colors.primary : colors.textTertiary}
                  disabled={updateProfile.isPending}
                  accessibilityLabel={`Disponibilité : ${profile.isAvailable ? 'activée' : 'désactivée'}`}
                  accessibilityRole="switch"
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
            ACTIVITÉ
          </Text>
          <View style={styles.card}>
            <MenuItem
              icon="person-outline"
              label="Modifier mon profil"
              onPress={() => router.push('/(professional)/onboarding')}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="list-outline"
              label="Mes services"
              onPress={() => router.push('/(professional)/services')}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="time-outline"
              label="Disponibilités"
              onPress={() => router.push('/(professional)/availability')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
            NOTIFICATIONS
          </Text>
          <View style={styles.card}>
            <MenuItem
              icon="notifications-outline"
              label="Mes notifications"
              onPress={() => router.push('/(professional)/notifications')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
            LÉGAL
          </Text>
          <View style={styles.card}>
            <MenuItem
              icon="document-text-outline"
              label="Conditions d'utilisation"
              onPress={() => router.push('/(professional)/terms')}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Politique de confidentialité"
              onPress={() => router.push('/(professional)/privacy-policy')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
            SESSION
          </Text>
          <View style={styles.card}>
            <Pressable
              style={styles.menuItem}
              onPress={handleLogout}
              accessibilityLabel="Se déconnecter"
              accessibilityRole="button"
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text variant="body" color={colors.error} style={styles.menuLabel}>Déconnexion</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.versionSection}>
          <Text variant="caption" color={colors.textTertiary} align="center">
            MONPRO v{APP_VERSION}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={styles.menuItem}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text variant="body" style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Retour"
        accessibilityRole="button"
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Paramètres</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxxl, gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: { paddingHorizontal: spacing.xs, letterSpacing: 0.5 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', ...shadows.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  settingInfo: { flex: 1, gap: 2, marginRight: spacing.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md, minHeight: 52 },
  menuLabel: { flex: 1 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: spacing.lg + 20 + spacing.md },
  versionSection: { paddingTop: spacing.lg },
  // Skeleton
  skeletonContent: { padding: spacing.lg, gap: spacing.md },
  skeletonCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  skeletonRow: { flexDirection: 'row', alignItems: 'center' },
  skeletonRowText: { flex: 1, gap: spacing.sm },
});
