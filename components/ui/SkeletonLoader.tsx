// Sk2l2t4n sh3mm2r l41d3ng st1t2
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

import { useColors } from '../../hooks/useColors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius, backgroundColor: colors.elevated, opacity },
        style,
      ]}
    />
  );
}

export function DealCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Skeleton height={140} borderRadius={10} style={{ marginBottom: 12 }} />
      <Skeleton height={12} width="60%" borderRadius={6} style={{ marginBottom: 8 }} />
      <Skeleton height={16} width="80%" borderRadius={6} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton height={20} width={80} borderRadius={6} />
        <Skeleton height={20} width={60} borderRadius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 12, marginBottom: 12 },
});
