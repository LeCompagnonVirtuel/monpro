import { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, Dimensions, type ViewToken } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text } from '@/components/ui';
import { OnboardingIllustration } from '@/components/onboarding/OnboardingIllustration';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { OnboardingFooter } from '@/components/onboarding/OnboardingFooter';
import { completeOnboarding } from '@/lib/onboarding';

const { width } = Dimensions.get('window');

type IllustrationType = 'discover' | 'request' | 'quotes' | 'professional';

interface Slide {
  id: string;
  title: string;
  description: string;
  illustration: IllustrationType;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Trouvez le bon professionnel',
    description:
      "Plomberie, électricité, réparation, entretien et bien plus encore. Trouvez facilement un professionnel adapté à votre besoin.",
    illustration: 'discover',
  },
  {
    id: '2',
    title: 'Expliquez simplement votre besoin',
    description:
      'Décrivez votre demande, choisissez le service dont vous avez besoin et recevez des réponses de professionnels qualifiés.',
    illustration: 'request',
  },
  {
    id: '3',
    title: 'Comparez et choisissez en toute confiance',
    description:
      'Recevez des devis, comparez les propositions et choisissez le professionnel qui correspond le mieux à votre besoin.',
    illustration: 'quotes',
  },
  {
    id: '4',
    title: 'Développez aussi votre activité',
    description:
      'Vous êtes professionnel ? Rejoignez MONPRO, recevez des demandes et développez votre activité.',
    illustration: 'professional',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const isLast = currentIndex === SLIDES.length - 1;
  const isFirst = currentIndex === 0;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<Slide>[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goToSlide = useCallback(
    (index: number) => {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    },
    [],
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      completeOnboarding().then(() => {
        router.replace('/(auth)/welcome');
      });
    } else {
      goToSlide(currentIndex + 1);
    }
  }, [isLast, currentIndex, goToSlide]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }, [currentIndex, goToSlide]);

  const handleSkip = useCallback(() => {
    completeOnboarding().then(() => {
      router.replace('/(auth)/welcome');
    });
  }, []);

  const renderItem = useCallback(({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        <OnboardingIllustration type={item.illustration} />
        <View style={styles.textSection}>
          <Text
            variant="h1"
            align="center"
            color={colors.text}
            style={styles.title}
          >
            {item.title}
          </Text>
          <Text
            variant="body"
            align="center"
            color={colors.textSecondary}
            style={styles.description}
          >
            {item.description}
          </Text>
        </View>
      </View>
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.inner}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />

        <OnboardingProgress total={SLIDES.length} current={currentIndex} />

        <OnboardingFooter
          isLast={isLast}
          isFirst={isFirst}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
  },
  textSection: {
    gap: spacing.md,
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontWeight: '800',
    fontSize: 24,
    lineHeight: 32,
  },
  description: {
    lineHeight: 24,
  },
});
