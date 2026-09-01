import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
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
import { useUpdateProfile } from '@/hooks/use-update-profile';
import { useAuthStore } from '@/stores/auth.store';
import { uploadsApi } from '@/api/uploads';

export default function ProfileScreen() {
  const logout = useAuthStore((s) => s.logout);
  const me = useMe();
  const requests = useServiceRequests({ limit: 100 });
  const conversations = useConversations();
  const updateProfile = useUpdateProfile();
  const [isUploading, setIsUploading] = useState(false);

  const user = me.data;
  const requestCount = requests.data?.total || 0;
  const completedCount = requests.data?.requests?.filter((r) => r.status === 'COMPLETED').length || 0;
  const messageCount = conversations.data?.length || 0;

  const handleRefresh = useCallback(() => {
    me.refetch();
    requests.refetch();
    conversations.refetch();
  }, [me, requests, conversations]);

  const handleAvatarPress = useCallback(async () => {
    if (isUploading) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie pour modifier votre photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const name = uri.split('/').pop() || 'avatar.jpg';
    const type = asset.mimeType || 'image/jpeg';

    setIsUploading(true);
    try {
      const { data: uploadResponse } = await uploadsApi.uploadImage({ uri, name, type }, 'avatars');
      await updateProfile.mutateAsync({ avatarUrl: uploadResponse.data.url });
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour votre photo. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, updateProfile]);

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

  if (me.error) {
    return (
      <View style={styles.container}>
        <ProfileHeader />
        <ErrorState message="Impossible de charger votre profil" onRetry={() => me.refetch()} />
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
          onCameraPress={handleAvatarPress}
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
    paddingBottom: spacing.xxl,
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
