// Onboarding carousel — 4 slides showcasing ChopQuick value prop
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { Button } from '../../components/ui/Button';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    image: require('@/assets/images/pic1.png'),
    title: 'Local Surplus,\nReal Savings',
    subtitle: 'Top Lagos restaurants offer up to 60% off on unsold meals from 8–9:30pm every night.',
  },
  {
    id: '2',
    image: require('@/assets/images/pic2.png'),
    title: 'Book, Pay,\nPick Up',
    subtitle: 'Pay with your ChopQuick wallet or card. Get a QR code and collect in minutes.',
  },
  {
    id: '3',
    image: require('@/assets/images/pic3.png'),
    title: 'Save Food,\nSave the Planet',
    subtitle: "Every meal you save reduces waste. Join Nigeria's largest food saving movement.",
  },
  {
    id: '4',
    image: require('@/assets/images/pic4.png'),
    title: 'Earn While\nYou Sleep',
    subtitle: 'Restaurant owners turn surplus into profit. List food, collect orders, grow your earnings.',
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#0A0A0A', '#141414']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header with logo */}
      <View style={[styles.header, { paddingTop: topPad + spacing.lg }]}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <View>
          <Text style={[typography.h3, { color: colors.foreground }]}>ChopQuick</Text>
          <Text style={[typography.caption, { color: colors.primary }]}>Save food. Save money.</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        contentContainerStyle={{ flexGrow: 1 }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 100);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.imageContainer}>
              <Image
                source={item.image}
                style={styles.slideImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
            </View>
            <View style={styles.textBlock}>
              <Text style={[typography.hero, { color: colors.foreground, textAlign: 'center' }]}>
                {item.title}
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', lineHeight: 24 }]}>
                {item.subtitle}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Bottom controls */}
      <View style={[styles.controls, { paddingBottom: bottomPad + spacing.lg }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === activeIndex ? colors.primary : colors.border,
                  width: i === activeIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Button
          label={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          variant="primary"
          size="lg"
        />

        <Pressable onPress={() => router.push('/(auth)/login')} style={styles.skip}>
          <Text style={[typography.bodyMedium, { color: colors.textMuted }]}>
            already have an account?{'  '}
            <Text style={{ color: colors.primary }}>Log in</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  slide: { flex: 1, width, alignItems: 'center', justifyContent: 'flex-start' },
  imageContainer: {
    width: width,
    height: height * 0.45,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  textBlock: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  controls: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10,10,10,0.95)',
    paddingTop: spacing.xl,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  skip: { alignItems: 'center', paddingBottom: spacing.sm },
});