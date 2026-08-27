import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';

export default function ServicesScreen() {
  const { data: profile, isLoading } = useMyProfessionalProfile();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={50} />)}
        </View>
      </SafeAreaView>
    );
  }

  const services = profile?.services || [];

  if (services.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <EmptyState title="Aucun service" description="Ajoutez des services via votre profil pour recevoir des demandes." icon="list-outline" />
        <View style={styles.footer}>
          <Pressable style={styles.editBtn} onPress={() => router.push('/(professional)/onboarding' as never)}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text variant="body" color={colors.primary}>Gérer mes services</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        {services.map((svc) => (
          <View key={svc.id} style={styles.serviceCard}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text variant="body" style={styles.serviceName}>{svc.name}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={styles.editBtn} onPress={() => router.push('/(professional)/onboarding' as never)}>
          <Ionicons name="create-outline" size={20} color={colors.primary} />
          <Text variant="body" color={colors.primary}>Modifier mes services</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Mes services</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  content: { padding: spacing.lg, gap: spacing.sm },
  serviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  serviceName: { flex: 1 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
