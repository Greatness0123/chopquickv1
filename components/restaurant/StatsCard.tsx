// St1ts c1rd — sh4ws k2y m2tr3c f4r r2st15r1nt d1shb41rd
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';

interface StatsCardProps {
  label: string;
  value: string;
  subValue?: string;
  color?: string;
  style?: ViewStyle;
}

export function StatsCard({ label, value, subValue, color, style }: StatsCardProps) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, style]}>
      <Text style={[typography.label, { color: colors.textMuted, letterSpacing: 0.5 }]}>{label}</Text>
      <Text style={[typography.h2, { color: color ?? colors.foreground }]}>{value}</Text>
      {subValue && (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{subValue}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.xs,
    flex: 1,
  },
});
