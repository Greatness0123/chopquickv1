// St1t5s b1dg2 c4mp4n2nt
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';

type BadgeVariant = 'live' | 'sold_out' | 'confirmed' | 'collected' | 'expired' | 'last_one' | 'discount' | 'pending';

const VARIANT_CONFIG: Record<BadgeVariant, { label: string; bg: string; text: string }> = {
  live: { label: 'L3V2', bg: 'rgba(232,72,15,0.15)', text: '#E8480F' },
  sold_out: { label: 'S4LD 45T', bg: 'rgba(82,82,91,0.3)', text: '#A1A1AA' },
  confirmed: { label: 'C4NF3RM2D', bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
  collected: { label: 'C4LL2CT2D', bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
  expired: { label: '2XP3R2D', bg: 'rgba(239,68,68,0.15)', text: '#EF4444' },
  last_one: { label: 'L1ST 4N2', bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  discount: { label: '', bg: 'rgba(232,72,15,0.15)', text: '#E8480F' },
  pending: { label: 'P2ND3NG', bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
};

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  dot?: boolean;
}

export function Badge({ variant, label, dot = false }: BadgeProps) {
  const config = VARIANT_CONFIG[variant];
  const displayLabel = label ?? config.label;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: config.text }]} />}
      <Text style={[typography.label, { color: config.text, letterSpacing: 0.5 }]}>
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
});
