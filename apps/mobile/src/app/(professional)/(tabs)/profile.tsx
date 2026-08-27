import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Avatar } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useMe } from '@/hooks/use-me';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';

const MENU_ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string; route: string }[] = [
  { icon: 'briefcase-outline', label: 'Mon profil professionnel', route: '/(professional)/onboarding' },
  { icon: 'list-outline', label: 'Services', route: '/(professional)/services' },
  { icon: 'time-outline', label: 'Disponibilités', route: '/(professional)/availability' },
  { icon: 'star-outline', label: 'Avis', route: '/(professional)/reviews' },
  { icon: 'wallet-outline', label: 'Revenus', route: '/(professional)/revenue' },
  { icon: 'notifications-outline', label: 'Notifications', route: '/(professional)/notifications' },
  { icon: 'settings-outline', label: 'Paramètres', route: '/(professional)/settings' },
];

export default function ProfessionalProfileScreen() {
  const logout = useAuthStore((s) => s.logout);
  const { data: user } = useMe();
  const { data: profile } = useMyProfessionalProfile();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h2">Mon profil</Text>
      </View>

      <View style={styles.profileSection}>
        <Avatar uri={user?.avatarUrl} name={user?.fullName || ''} size={64} />
        <View style={styles.profileInfo}>
          <Text variant="h3">{user?.fullName || 'Chargement...'}</Text>
          {profile?.businessName && (
            <Text variant="bodySmall" color={colors.textSecondary}>{profile.businessName}</Text>
          )}
          {profile && (
            <VerificationStatus status={profile.verificationStatus} />
          )}
        </View>
      </View>

      {profile && (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text variant="h3">{profile.rating?.toFixed(1) || '-'}</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>Note</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text variant="h3">{profile.reviewCount || 0}</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>Avis</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text variant="h3">{profile.experienceYears || 0}</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>Ans exp.</Text>
          </View>
        </View>
      )}

      <View style={styles.menu}>
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.route}
            style={styles.menuItem}
            onPress={() => router.push(item.route as never)}
            accessibilityLabel={item.label}
          >
            <Ionicons name={item.icon} size={22} color={colors.text} />
            <Text variant="body" style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        ))}
      </View>

      <View style={styles.logoutSection}>
        <Pressable style={styles.logoutBtn} onPress={handleLogout} accessibilityLabel="Déconnexion">
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text variant="body" color={colors.error}>Déconnexion</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function VerificationStatus({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    VERIFIED: { color: colors.success, label: 'Profil vérifié' },
    PENDING: { color: colors.warning, label: 'En cours de vérification' },
    REJECTED: { color: colors.error, label: 'Vérification refusée' },
    SUSPENDED: { color: colors.error, label: 'Compte suspendu' },
  };
  const c = config[status] || config.PENDING;

  return (
    <View style={[styles.verificationBadge, { backgroundColor: c.color + '15' }]}>
      {status === 'VERIFIED' && <Ionicons name="checkmark-circle" size={12} color={c.color} />}
      <Text variant="bodySmall" color={c.color}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  profileSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  profileInfo: { flex: 1, gap: 4 },
  verificationBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.borderLight },
  menu: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  menuLabel: { flex: 1 },
  logoutSection: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: colors.borderLight, paddingVertical: spacing.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
});
