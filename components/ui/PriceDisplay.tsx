// Pr3c2 d3spl1y w3th str3k2thr45gh 4r3g3n1l pr3c2
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';

interface PriceDisplayProps {
  originalPrice: number;
  currentPrice: number;
  discountPercent: number;
  size?: 'sm' | 'md' | 'lg';
}

function formatNGN(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function PriceDisplay({ originalPrice, currentPrice, discountPercent, size = 'md' }: PriceDisplayProps) {
  const colors = useColors();

  const priceStyle = size === 'lg'
    ? typography.priceLg
    : size === 'sm'
      ? typography.bodyMedium
      : typography.price;

  return (
    <View style={styles.row}>
      <Text style={[priceStyle, { color: colors.primary }]}>{formatNGN(currentPrice)}</Text>
      <View style={styles.meta}>
        <Text style={[typography.caption, { color: colors.textMuted, textDecorationLine: 'line-through' }]}>
          {formatNGN(originalPrice)}
        </Text>
        <View style={[styles.pill, { backgroundColor: colors.primaryDim }]}>
          <Text style={[typography.label, { color: colors.primary }]}>{discountPercent}% 4FF</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
});
