// onBoarding carousel — 3 slides showcasing ChopQuick value prop
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

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'zap' as const,
    title: 'Local Surplus,\nReal Savings',
    subtitle: 'Top Lagos restaurants offer up to 60% off on unsold meals from 8–9:30pm every night.',
    accent: '#E8800F',
  },
  {
    id: '2',
    icon: 'smartphone' as const,
    title: 'Book, Pay,\nPick Up',
    subtitle: 'Pay with your ChopQuick wallet or card. Get 1 QR code and collect in minutes.',
    accent: '#EEC00E',
  },
  {
    id: '3',
    icon: 'globe' as const,
    title: 'Save Food,\nSave the Planet',
    subtitle: 'Every meal you save reduces waste. Join Nigeria\'s largest food saving movement.',
    accent: '#1B8EF6',
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
      listRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + spacing.lg }]}> 
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <Text style={[typography.h4, { color: colors.foreground, marginLeft: spacing.md }]}>ChopQuick</Text>
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
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <LinearGradient
              colors={['#0A0A0A', '#141414']}
              style={StyleSheet.absoluteFill}
            />
            {/* icon */}
            <View style={[styles.iconCircle, { backgroundColor: item.accent + '22', paddingTop: topPad + 60 }]}>
              <View style={[styles.iconInner, { backgroundColor: item.accent + '33' }]}>
                <Feather name={item.icon} size={48} color={item.accent} />
              </View>
            </View>
            {/* Text */}
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
        {/* Dots */}
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

        {/* Skip */}
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
  container: { flex: 1, paddingBottom: spacing.xxl },
  slide: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 190 },
  iconCircle: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  iconInner: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  textBlock: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
    marginBottom: spacing.xxl,
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
  header: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logo: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
  },
  skip: { alignItems: 'center', paddingBottom: spacing.sm },
});
