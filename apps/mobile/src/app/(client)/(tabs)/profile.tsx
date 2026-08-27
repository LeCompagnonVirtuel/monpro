import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useCallback } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Skeleton } from '@/components/ui';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileIdentity } from '@/components/profile/ProfileIdentity';
import { PremiumBanner } from '@/components/profile/PremiumBanner';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileMenu } from '@/components/profile/ProfileMenu';
import { PremiumCTA } from '@/components/profile/PremiumCTA';
import { ProfileLogout } from '@/components/profile/ProfileLogout';
import { useMe } from '@/hooks/use-me';
import { useServiceRequests } from '@/hooks/use-service-requests';
import { useConversations } from '@/hooks/use-conversations';
import { useAuthStore } from '@/stores/auth.store';

export default function ProfileScreen() {
  const logout = useAuthStore((s) => s.logout);
  const me = useMe();
  const requests = useServiceRequests({ limit: 100 });
  const conversations = useConversations();

  const user = me.data;
  const requestCount = requests.data?.total || 0;
  const completedCount = requests.data?.requests?.filter((r) => r.status === 'COMPLETED').length || 0;
  const messageCount = conversations.data?.length || 0;

  const handleRefresh = useCallback(() => {
    me.refetch();
    requests.refetch();
    conversations.refetch();
  }, [me, requests, conversations]);

  if (me.isLoading) {
    return (
      <View style={styles.container}>
        <ProfileHeader />
        <View style={styles.loadingContent}>
          <Skeleton width={100} height={100} borderRadius={50} />
          <Skeleton width={180} height={24} />
          <Skeleton width={120} height={16} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={me.isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.secondary}
          />
        }
      >
        <ProfileHeader />

        <ProfileIdentity
          fullName={user?.fullName || ''}
          avatarUrl={user?.avatarUrl}
          location={user?.cityId ? undefined : undefined}
          onCameraPress={() => {}}
        />

        <View style={styles.section}>
          <PremiumBanner memberSince={user?.createdAt} />
        </View>

        <View style={styles.section}>
          <ProfileStats
            requestCount={requestCount}
            completedCount={completedCount}
            messageCount={messageCount}
            averageRating={null}
            reviewCount={0}
          />
        </View>

        <View style={styles.section}>
          <ProfileMenu />
        </View>

        <View style={styles.section}>
          <PremiumCTA />
        </View>

        <View style={styles.section}>
          <ProfileLogout onLogout={logout} />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingContent: {
    alignItems: 'center',
    marginTop: -40,
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  section: {
    marginTop: spacing.xl,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
