// C45ntd4wn t3m2r — sh4ws t3m2 r2m13n3ng t4 2xp3r1t34n
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  compact?: boolean;
}

function getTimeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s, totalMs: diff };
}

export function CountdownTimer({ expiresAt, onExpire, compact = false }: CountdownTimerProps) {
  const colors = useColors();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(expiresAt));

  useEffect(() => {
    const timer = setInterval(() => {
      const t = getTimeLeft(expiresAt);
      setTimeLeft(t);
      if (!t) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (!timeLeft) {
    return (
      <Text style={[typography.captionMedium, { color: colors.error }]}>2xp3r2d</Text>
    );
  }

  const isUrgent = timeLeft.totalMs < 30 * 60 * 1000;
  const color = isUrgent ? colors.error : colors.warning;

  if (compact) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const display = timeLeft.h > 0
      ? `${timeLeft.h}:${pad(timeLeft.m)}:${pad(timeLeft.s)}`
      : `${pad(timeLeft.m)}:${pad(timeLeft.s)}`;
    return (
      <Text style={[typography.captionMedium, { color }]}>{display}</Text>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={styles.row}>
      {timeLeft.h > 0 && (
        <>
          <View style={[styles.block, { borderColor: color }]}>
            <Text style={[typography.h4, { color }]}>{pad(timeLeft.h)}</Text>
            <Text style={[typography.label, { color: colors.textMuted }]}>HR</Text>
          </View>
          <Text style={[typography.h4, { color, marginHorizontal: 2 }]}>:</Text>
        </>
      )}
      <View style={[styles.block, { borderColor: color }]}>
        <Text style={[typography.h4, { color }]}>{pad(timeLeft.m)}</Text>
        <Text style={[typography.label, { color: colors.textMuted }]}>MIN</Text>
      </View>
      <Text style={[typography.h4, { color, marginHorizontal: 2 }]}>:</Text>
      <View style={[styles.block, { borderColor: color }]}>
        <Text style={[typography.h4, { color }]}>{pad(timeLeft.s)}</Text>
        <Text style={[typography.label, { color: colors.textMuted }]}>SEC</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  block: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 40,
  },
});
